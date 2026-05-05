import http from "http";
import { Server } from "socket.io";
import { SOCKET_EVENTS } from "./utils/constants";


const server = http.createServer();

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
        console.log("Received raise hand event:", data);
        const user = userMap.get(socket.id);
        console.log("User info for socket:", user);
        if (!user) return;

        socket.to(data.roomId).emit(SOCKET_EVENTS.RAISE_HAND, {
            publisherId: user.publisherId,
            username: user.username,
            raised: data.raised,
        });

        console.log("Emitted raise hand event to room:", data.roomId);
    });

    socket.on(SOCKET_EVENTS.REACTION, (data: { roomId: string; reaction: string }) => {
        socket.to(data.roomId).emit(SOCKET_EVENTS.REACTION, data);
    });

    socket.on(SOCKET_EVENTS.MUTE_TOGGLE, (data: { roomId: string; isMuted: boolean }) => {
        socket.to(data.roomId).emit(SOCKET_EVENTS.MUTE_TOGGLE, data);
    });

    socket.on(SOCKET_EVENTS.CHAT, (data: { roomId: string; message: string; username: string }) => {
        io.to(data.roomId).emit(SOCKET_EVENTS.CHAT, data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(4000, () => {
    console.log("Socket.IO running on port 4000");
});