import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";
import { SOCKET_EVENTS } from "./utils/constants";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import Conversation from "./models/Conversation.model";
import Message from "./models/Message.model";
import { authMiddleware } from "./utils/authMiddleware";
import ConnectionModel from "./models/Connection.model";

dotenv.config();

/**
 * EXPRESS APP
 */
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

/**
 * MIDDLEWARE
 */

app.use(express.json());
app.use(cookieParser());

/**
 * AUTH ROUTES
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);

/**
 * DATABASE
 */
connectDB();

/**
 * HTTP SERVER
 */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Socket middleware
io.use((socket, next) => {
  try {
    console.log("socket middlware running :");
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      return next(new Error("No token"));
    }
    console.log("cookies :", cookies);

    const token = cookies
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return next(new Error("No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log("decode :", decoded);

    socket.data.user = decoded;

    next();
  } catch (error) {
    console.log("SOCKET MIDDLEWARE ERROR :", error);
    next(new Error("Unauthorized"));
  }
});

// key: socket.id → value: { publisherId, username, roomId }
const meetingUsers = new Map();
// online users map for all authenticated and logined users
const onlineUsers = new Map();

// Emit online users
const emitOnlineUsers = () => {
  io.emit(SOCKET_EVENTS.ONLINE_USERS, Array.from(onlineUsers.keys()));
};
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const user = socket.data.user;

  onlineUsers.set(user.userId, {
    socketId: socket.id,
    username: user.username,
  });

  // Emit the online users once new users live
  emitOnlineUsers();

  // Join personal room for direct messaging
  socket.join(user.userId);

  // ------------------- Meeting Room socket event --------------------------------------
  socket.on(
    SOCKET_EVENTS.REGISTER_USER,
    ({ roomId, publisherId, username }) => {
      console.log("Registering user:", { roomId, publisherId, username });

      meetingUsers.set(socket.id, {
        publisherId,
        username,
        roomId,
      });
    },
  );

  socket.on(
    SOCKET_EVENTS.JOIN,
    ({ roomId, username }: { roomId: string; username: string }) => {
      socket.join(roomId);

      socket.to(roomId).emit(SOCKET_EVENTS.USER_LIST, {
        userId: socket.id,
        username,
      });
    },
  );

  socket.on(
    SOCKET_EVENTS.RAISE_HAND,
    (data: { roomId: string; raised: boolean }) => {
      const user = meetingUsers.get(socket.id);
      if (!user) return;

      socket.to(data.roomId).emit(SOCKET_EVENTS.RAISE_HAND, {
        publisherId: user.publisherId,
        username: user.username,
        raised: data.raised,
      });
    },
  );

  socket.on(SOCKET_EVENTS.REACTION, (data) => {
    const user = meetingUsers.get(socket.id);
    if (!user) return;

    socket.to(data.roomId).emit(SOCKET_EVENTS.REACTION, {
      reaction: data.reaction,
      publisherId: user.publisherId,
      username: user.username,
    });
  });

  socket.on(
    SOCKET_EVENTS.MUTE_TOGGLE,
    (data: { roomId: string; isMuted: boolean }) => {
      socket.to(data.roomId).emit(SOCKET_EVENTS.MUTE_TOGGLE, data);
    },
  );

  socket.on(SOCKET_EVENTS.CAMERA_TOGGLE, (data) => {
    const user = meetingUsers.get(socket.id);
    if (!user) return;

    socket.to(user.roomId).emit(SOCKET_EVENTS.CAMERA_TOGGLE, {
      publisherId: user.publisherId,
      isCameraOff: data.isCameraOff,
    });
  });

  socket.on(SOCKET_EVENTS.CHAT, (data) => {
    const user = meetingUsers.get(socket.id);

    if (!user) return;

    io.to(data.roomId).emit(SOCKET_EVENTS.CHAT, {
      id: crypto.randomUUID(),
      sender: user.username,
      senderId: user.publisherId,
      message: data.message,
      timestamp: Date.now(),
    });
  });

  socket.on(SOCKET_EVENTS.LEAVE, ({ roomId }) => {
    socket.leave(roomId);
  });

  // ---------------- Private messages socket events -----------------------------

  socket.on(SOCKET_EVENTS.SEND_CONNECTION_REQUEST, async (data) => {
    const sender = socket.data.user;
    console.log("send connection request :", sender);
    const existing = await ConnectionModel.findOne({
      $or: [
        {
          requesterId: sender?.userId,
          receiverId: data.targetUserId,
        },
        {
          requesterId: data.targetUserId,
          receiverId: sender.userId,
        },
      ],
    });

    if (existing) return;

    const connection = await ConnectionModel.create({
      requesterId: sender.userId,
      receiverId: data.targetUserId,
      note: data?.note,
      status: "pending",
    });

    io.to(data.targetUserId).emit(
      SOCKET_EVENTS.CONNECTION_REQUEST_RECEIVED,
      connection,
    );
  });

  socket.on(
    SOCKET_EVENTS.ACCEPT_CONNECTION_REQUEST,
    async ({ connectionId }) => {
      console.log("connection request accepted :", connectionId);
      const updateConnection = await ConnectionModel.findByIdAndUpdate(
        connectionId,
        {
          status: "accepted",
        },
        {
          returnDocument: "after",
        },
      );
      console.log("REQUST ACCEPTED UPDATE CONNECGTION :", updateConnection);
      if (!updateConnection) return;

      io.to(updateConnection.requesterId.toString()).emit(
        SOCKET_EVENTS.CONNECTION_ACCEPTED,
        updateConnection,
      );

      io.to(updateConnection.receiverId.toString()).emit(
        SOCKET_EVENTS.CONNECTION_ACCEPTED,
        updateConnection,
      );
    },
  );

  socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, async (data) => {
    try {
      const sender = socket.data.user;
      console.log("private message sender :", sender);
      console.log("data :", data);

      const { text, receiverId } = data;

      /*
            FIND EXISTING CONVERSATION
            */

      let conversation = await Conversation.findOne({
        participants: {
          $all: [sender.userId, receiverId],
        },
      });

      /*
            CREATE IF NOT EXISTS
            */

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [sender.userId, receiverId],
        });
      }

      /*
            SAVE MESSAGE
            */

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: sender.userId,
        text,
      });

      /*
            UPDATE CONVERSATION'S LAST MESSAGE
            */

      await Conversation.updateOne(
        { _id: conversation._id },
        { lastMessage: message._id },
      );

      /*
            EMIT TO RECEIVER
            */
      console.log("emit to receiverId :", receiverId);
      io.to(receiverId).emit(SOCKET_EVENTS.PRIVATE_MESSAGE_RECEIVED, {
        _id: message._id,

        conversationId: conversation._id,

        senderId: sender.userId,

        receiverId,

        senderName: sender.username,

        text,

        createdAt: message.createdAt,
      });

      /*
            OPTIONAL:
            ALSO SEND BACK TO SENDER
            */

      // socket.emit(
      //     SOCKET_EVENTS.PRIVATE_MESSAGE_RECEIVED,
      //     {
      //         _id: message._id,

      //         conversationId:
      //             conversation._id,

      //         senderId:
      //             sender.userId,

      //         receiverId,

      //         senderName:
      //             sender.username,

      //         text,

      //         createdAt:
      //             message.createdAt
      //     }
      // );
    } catch (error: any) {
      console.error("Error sending private message:", error);
      socket.emit("error", {
        message: "Failed to send message",
        error: error?.message,
      });
    }
  });

  socket.on(
    SOCKET_EVENTS.REJECT_CONNECTION_REQUEST,
    async ({ connectionId }) => {
      const updatedConnection = await ConnectionModel.findByIdAndUpdate(
        connectionId,
        {
          status: "rejected",
        },
        {
          returnDocument: "after",
        },
      );

      if (!updatedConnection) return;

      io.to(updatedConnection.requesterId.toString()).emit(
        SOCKET_EVENTS.CONNECTION_REJECTED,
        updatedConnection,
      );

      io.to(updatedConnection.receiverId.toString()).emit(
        SOCKET_EVENTS.CONNECTION_REJECTED,
        updatedConnection,
      );
    },
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    meetingUsers.delete(socket.id);
    onlineUsers.delete(user.userId);
    emitOnlineUsers();
  });
});

/**
 * START SERVER
 */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Socket.IO running on port ${PORT}`);
});
