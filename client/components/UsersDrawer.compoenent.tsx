"use client";

import { NEXT_HANDLER_URL } from "@/lib/constants";
import { IPrivateMessage, IUser } from "@/types/chat.types";
import { useEffect, useState } from "react";
import { useGlobalSocket } from "@/app/context/socket.context";
import { SOCKET_EVENTS } from "@/lib/constants";

export default function OnlineUsersDrawer({
    open,
    onClose
}: {
    open: boolean;
    onClose: () => void;
}) {
    const socket = useGlobalSocket();
    const [users, setUsers] = useState<IUser[] | null>(null)
    const [selectedUser, setSelectedUser] =
        useState<IUser | null>(null);

    const [messages, setMessages] =
        useState<IPrivateMessage[]>([]);

    const [messageText, setMessageText] =
        useState("");

    const fetchUsers = async () => {
        try {
            console.log('fetch users')
            const res = await fetch(NEXT_HANDLER_URL.GET_USERS, {
                method: "GET"
            })

            const usersList = await res.json();
            console.log('users response :', usersList)

            if (res?.ok && usersList?.users) {
                setUsers(usersList?.users)
            }
        } catch (error: any) {
            console.log('error on fetching users :', error.message)
        }
    }

    useEffect(() => {
        if (open) {
            fetchUsers()
        }
    }, [open])


    // Sockert listners
    useEffect(() => {
        console.log("socket :", socket)
        if (!socket) return

        socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE_RECEIVED,
            (message) => {
                console.log('message recived :', message)
                setMessages((prev) => [
                    ...prev,
                    message
                ])
            }
        )

        return () => {
            socket.off(
                SOCKET_EVENTS.PRIVATE_MESSAGE_RECEIVED
            )
        }
    }, [socket])

    // Load messages when user selects a conversation
    useEffect(() => {
        if (!selectedUser) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
            try {
                const res = await fetch(
                    `${NEXT_HANDLER_URL.GET_CONVERSATION}?userId=${selectedUser._id}`,
                    { method: 'GET' }
                );

                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.data || []);
                } else {
                    console.error('Failed to load messages');
                    setMessages([]);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
                setMessages([]);
            }
        };

        loadMessages();
    }, [selectedUser]);

    // Send message 
    const sendMessage = () => {
        if (!socket ||
            !selectedUser ||
            !messageText?.trim()
        ) return

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}")

        const payload = {
            receiverId: selectedUser?._id,
            text: messageText
        }

        socket.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, payload)

        setMessages((prev) => [
            ...prev,
            {
                senderId: currentUser._id,
                text: messageText,
                createdAt: new Date().toISOString()
            }
        ])

        setMessageText("")
    }

    if (!open) {
        return null;
    }

    return (
        <div className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-sm
        ">

            {/* BACKDROP */}
            <div
                onClick={onClose}
                className="absolute inset-0"
            />

            {/* DRAWER */}
            <div className="
                relative
                w-[70vw]
                max-w-5xl
                h-[75vh]
                rounded-[32px]
                border
                border-white/10
                bg-neutral-950
                overflow-hidden
                flex
                flex-col
            ">

                {/* HEADER */}
                <div className="
                    h-[80px]
                    border-b
                    border-white/10
                    px-8
                    flex
                    items-center
                    justify-between
                    shrink-0
                ">

                    <div>

                        <h2 className="
                            text-2xl
                            font-bold
                            text-white
                        ">
                            Online Users
                        </h2>

                        <p className="
                            text-sm
                            text-neutral-400
                            mt-1
                        ">
                            Currently active users
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="
                            w-11
                            h-11
                            rounded-xl
                            border
                            border-white/10
                            text-white
                            hover:bg-white/5
                            transition-all
                        "
                    >
                        ✕
                    </button>

                </div>

                {/* TABLE */}
                <div className="flex flex-1 overflow-hidden">

                    {/* LEFT SIDEBAR */}
                    <div className="
        w-[320px]
        border-r
        border-white/10
        overflow-y-auto
    ">

                        {
                            users?.map((user) => (

                                <div
                                    key={user._id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`
                        px-5
                        py-4
                        border-b
                        border-white/5
                        cursor-pointer
                        transition-all

                        ${selectedUser?._id === user._id
                                            ? "bg-white/10"
                                            : "hover:bg-white/[0.03]"
                                        }
                    `}
                                >

                                    <div className="flex items-center gap-3">

                                        <div className="
                            w-11
                            h-11
                            rounded-full
                            bg-indigo-600
                            flex
                            items-center
                            justify-center
                            text-white
                            font-bold
                        ">
                                            {user.name[0]}
                                        </div>

                                        <div>
                                            <h3 className="text-white font-medium">
                                                {user.name}
                                            </h3>

                                            <p className="text-sm text-gray-400">
                                                {user.email}
                                            </p>
                                        </div>

                                    </div>

                                </div>
                            ))
                        }

                    </div>

                    {/* RIGHT CHAT AREA */}
                    <div className="flex-1 flex flex-col">

                        {
                            !selectedUser ? (

                                <div className="
                    flex-1
                    flex
                    items-center
                    justify-center
                    text-gray-500
                ">
                                    Select a user to start chatting
                                </div>

                            ) : (

                                <>
                                    {/* HEADER */}
                                    <div className="
                        h-[80px]
                        border-b
                        border-white/10
                        px-6
                        flex
                        items-center
                    ">

                                        <div className="
                            w-11
                            h-11
                            rounded-full
                            bg-indigo-600
                            flex
                            items-center
                            justify-center
                            text-white
                            font-bold
                        ">
                                            {selectedUser.name[0]}
                                        </div>

                                        <div className="ml-4">
                                            <h2 className="text-white font-semibold">
                                                {selectedUser.name}
                                            </h2>

                                            <p className="text-sm text-gray-400">
                                                Online
                                            </p>
                                        </div>

                                    </div>

                                    {/* MESSAGES */}
                                    <div className="
                        flex-1
                        overflow-y-auto
                        p-6
                        space-y-4
                    ">

                                        {messages && messages?.length > 0 ?
                                            messages?.map((msg, index) => {

                                                const currentUser =
                                                    JSON.parse(
                                                        localStorage.getItem("user") || "{}"
                                                    );

                                                const isMine =
                                                    msg.senderId === currentUser._id;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`
                                                                flex
                                                                 ${isMine ? "justify-end" : "justify-start"}
                                                                `}
                                                    >

                                                        <div className={`
                                                                max-w-[70%]
                                                                px-4
                                                                py-3
                                                                rounded-2xl
                                                                text-sm

                                                                ${isMine
                                                                ? "bg-indigo-600 text-white"
                                                                : "bg-neutral-800 text-white"
                                                            }
                                                        `}>
                                                            {msg.text}
                                                        </div>

                                                    </div>
                                                );
                                            })
                                            : <p className="text-center text-sm text-gray-500">Start your chat</p>}

                                    </div>

                                    {/* INPUT */}
                                    <div className="
                        h-[90px]
                        border-t
                        border-white/10
                        px-5
                        flex
                        items-center
                        gap-4
                    ">

                                        <input
                                            value={messageText}
                                            onChange={(e) =>
                                                setMessageText(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                console.log('on enter :', e.key)
                                                if (e.key === "Enter") {
                                                    sendMessage()
                                                }
                                            }}
                                            placeholder="Type message..."
                                            className="
                                flex-1
                                h-[50px]
                                rounded-2xl
                                bg-neutral-900
                                border
                                border-white/10
                                px-5
                                text-white
                                outline-none
                            "
                                        />

                                        <button
                                            onClick={sendMessage}
                                            className="
                                h-[50px]
                                px-6
                                rounded-2xl
                                bg-indigo-600
                                text-white
                                font-semibold
                            "
                                        >
                                            Send
                                        </button>

                                    </div>
                                </>
                            )
                        }

                    </div>

                </div>

            </div>

        </div>
    );
}