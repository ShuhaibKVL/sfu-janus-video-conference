import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import { SOCKET_EVENTS } from "./utils/constants";

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
        origin: "*",
    },
});

// key: socket.id → value: { publisherId, username, roomId }
const userMap = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on(SOCKET_EVENTS.REGISTER_USER, ({ roomId, publisherId, username }) => {
        userMap.set(socket.id, {
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
        const user = userMap.get(socket.id);
        if (!user) return;

        socket.to(data.roomId).emit(SOCKET_EVENTS.RAISE_HAND, {
            publisherId: user.publisherId,
            username: user.username,
            raised: data.raised,
        });
    });

    socket.on(SOCKET_EVENTS.REACTION, (data) => {
        const user = userMap.get(socket.id);
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
        const user = userMap.get(socket.id);
        if (!user) return;

        socket.to(user.roomId).emit(SOCKET_EVENTS.CAMERA_TOGGLE, {
            publisherId: user.publisherId,
            isCameraOff: data.isCameraOff,
        });
    });

    socket.on(SOCKET_EVENTS.CHAT, (data) => {
        const user = userMap.get(socket.id);

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

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        userMap.delete(socket.id);
    });
});

/**
 * START SERVER
 */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Socket.IO running on port ${PORT}`);
});