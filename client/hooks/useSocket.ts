import {
    useEffect,
    useState,
} from "react";

import {
    SOCKET_EVENTS
} from "@/lib/constants";
import { useGlobalSocket } from "@/app/context/socket.context";

export const useSocket = (
    roomId: number,
    username: string,
) => {

    const socket = useGlobalSocket();
    const [isConnected, setIsConnected] =
        useState(false);

    /*
    =========================
    ROOM JOIN
    =========================
    */

    useEffect(() => {
        if (!socket) {
            console.warn("Socket not available yet");
            return;
        }

        const handleConnect = () => {

            console.log(
                "Socket connected:",
                socket.id
            );

            setIsConnected(true);

            /*
            JOIN MEETING ROOM
            */

            socket.emit(
                SOCKET_EVENTS.JOIN,
                {
                    roomId,
                    username,
                }
            );
        };

        const handleDisconnect = () => {

            setIsConnected(false);

            console.log("Socket disconnected");
        };

        /*
        listeners
        */

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        /*
        already connected case
        */

        if (socket.connected) {
            handleConnect();
        }

        return () => {

            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            /*
            IMPORTANT:
            leave ONLY room
            NOT socket disconnect
            */

            socket.emit(
                SOCKET_EVENTS.LEAVE,
                {
                    roomId,
                }
            );
        };

    }, [
        socket,
        roomId,
        username
    ]);

    /*
    =========================
    ACTIONS
    =========================
    */

    const emitRaiseHand = (
        data: {
            roomId: number;
            userId: string;
            username: string;
            raised: boolean;
        }
    ) => {

        if (!socket?.connected) {
            console.warn("Socket not connected");
            return;
        }

        socket.emit(
            SOCKET_EVENTS.RAISE_HAND,
            data
        );
    };

    return {
        socket,
        emitRaiseHand,
        isConnected
    };
};