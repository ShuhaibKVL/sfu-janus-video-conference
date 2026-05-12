import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_URL, SOCKET_EVENTS } from "@/lib/constants";

export const useSocket = (
    roomId: number,
    username: string
) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {

        const socketInstance = io(SERVER_URL);

        socketRef.current = socketInstance;

        socketInstance.on("connect", () => {
            console.log("Connected to socket server with ID:", socketInstance.id);

            setIsConnected(true);

            socketInstance.emit(SOCKET_EVENTS.JOIN, {
                roomId,
                username,
            });
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        return () => {
            socketInstance.disconnect();
        };

    }, [roomId, username]);

    const emitRaiseHand = (data: {
        roomId: number;
        userId: string;
        username: string;
        raised: boolean;
    }) => {
        if (!socketRef.current?.connected) {
            console.log("Socket not connected");
            return;
        }
        socketRef.current?.emit(
            SOCKET_EVENTS.RAISE_HAND,
            data
        );
    };

    return {
        socketRef,
        emitRaiseHand,
        isConnected,
    };
};