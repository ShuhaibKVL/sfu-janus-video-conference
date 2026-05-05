import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/lib/constants";

export const useSocket = (roomId: number, username: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io("http://localhost:4000");

        socketRef.current = socket;

        socket.emit(SOCKET_EVENTS.JOIN, {
            roomId,
            username,
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId, username]);

    const emitRaiseHand = (data: {
        roomId: number;
        userId: string;
        username: string;
        raised: boolean;
    }) => {
        socketRef.current?.emit(SOCKET_EVENTS.RAISE_HAND, data);
    };

    return {
        socketRef,
        emitRaiseHand,
    };
};