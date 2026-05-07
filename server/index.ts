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
    });
});

server.listen(4000, () => {
    console.log("Socket.IO running on port 4000");
});