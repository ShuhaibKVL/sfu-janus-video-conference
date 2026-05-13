import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import { SOCKET_EVENTS } from "./utils/constants";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

dotenv.config();

/**
 * EXPRESS APP
 */
const app = express();

/**
 * MIDDLEWARE
 */

app.use(express.json());
/**
 * AUTH ROUTES
 */
app.use("/api/auth", authRoutes);
app.use(cookieParser());
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
        credentials: true
    },
});

// Socket middleware
io.use((socket, next) => {
    try {
        console.log('socket middlware running :')
        const cookies = socket.handshake.headers.cookie

        if (!cookies) {
            return next(new Error("No token"))
        }
        console.log('cookies :', cookies)

        const token = cookies
            .split("; ")
            .find((c) => c.startsWith("token="))
            ?.split("=")[1];

        if (!token) {
            return next(new Error("No token"));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        )
        console.log('decode :', decoded)

        socket.data.user = decoded

        next()
    } catch (error) {
        console.log("SOCKET MIDDLEWARE ERROR :", error);
        next(new Error('Unauthorized'))
    }
})

// key: socket.id → value: { publisherId, username, roomId }
const meetingUsers = new Map();
// online users map for all authenticated and logined users
const onlineUsers = new Map()

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const user = socket.data.user

    onlineUsers.set(user.userId, {
        socketId: socket.id,
        username: user.username
    })

    // ------------------- Meeting Room socket event --------------------------------------
    socket.on(SOCKET_EVENTS.REGISTER_USER, ({ roomId, publisherId, username }) => {
        console.log("Registering user:", { roomId, publisherId, username });

        meetingUsers.set(socket.id, {
            publisherId,
            username,
            roomId,
        });
    });

    socket.on(SOCKET_EVENTS.JOIN, ({ roomId, username }: { roomId: string; username: string }) => {
        socket.join(roomId);

        socket.to(roomId).emit(SOCKET_EVENTS.USER_LIST, {
            userId: socket.id,
            username,
        });
    });

    socket.on(SOCKET_EVENTS.RAISE_HAND, (data: { roomId: string, raised: boolean }) => {
        const user = meetingUsers.get(socket.id);
        if (!user) return;

        socket.to(data.roomId).emit(SOCKET_EVENTS.RAISE_HAND, {
            publisherId: user.publisherId,
            username: user.username,
            raised: data.raised,
        });
    });

    socket.on(SOCKET_EVENTS.REACTION, (data) => {
        const user = meetingUsers.get(socket.id);
        if (!user) return;

        socket.to(data.roomId).emit(SOCKET_EVENTS.REACTION, {
            reaction: data.reaction,
            publisherId: user.publisherId,
            username: user.username,
        });
    });

    socket.on(SOCKET_EVENTS.MUTE_TOGGLE, (data: { roomId: string; isMuted: boolean }) => {
        socket.to(data.roomId).emit(SOCKET_EVENTS.MUTE_TOGGLE, data);
    });

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

        io.to(data.roomId).emit(
            SOCKET_EVENTS.CHAT,
            {
                id: crypto.randomUUID(),
                sender: user.username,
                senderId: user.publisherId,
                message: data.message,
                timestamp: Date.now(),
            }
        )
    });

    socket.on(
        SOCKET_EVENTS.LEAVE,
        ({ roomId }) => {

            socket.leave(roomId);
        });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        meetingUsers.delete(socket.id);
    });
});

/**
 * START SERVER
 */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Socket.IO running on port ${PORT}`);
});