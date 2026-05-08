"use client";

import { useEffect, useRef, useState } from "react";
import { IChatMessage } from "@/types/chat.types";

interface Props {
    messages: IChatMessage[];
    sendMessage: (message: string) => void;
    myPublisherId: number | null;
}

export default function ChatPanel({
    messages,
    sendMessage,
    myPublisherId,
}: Props) {
    console.log("ChatPanel rendered with messages:", messages);
    const [input, setInput] = useState("");

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        sendMessage(input);

        setInput("");
    };

    return (
        <div className="w-[340px] h-full bg-neutral-950 border-l border-white/10 flex flex-col">
            {/* HEADER */}
            <div className="p-4 border-b border-white/10 font-semibold">
                In-call messages
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMine = msg.senderId === myPublisherId;
                    console.log("isMIne :", isMine, "typeof :", typeof msg.senderId, " ><", typeof myPublisherId);
                    return (
                        <div key={msg.id} className={`${isMine ? 'text-right' : 'text-left'}`}>
                            <div className="text-xs text-neutral-400 mb-1">
                                {msg.sender}
                            </div>

                            <div
                                className={`inline-block
                                            max-w-[80%]
                                            rounded-2xl
                                            px-4 py-2
                                            text-sm
                                            break-words
                                        ${isMine
                                        ? "bg-blue-950 text-white"
                                        : "bg-neutral-800 text-white"
                                    }
    `}
                            >
                                {msg.message}
                            </div>
                        </div>
                    )
                })}

                <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 border-t border-white/10 flex gap-2">
                <input
                    value={input}
                    onChange={(e) =>
                        setInput(e.target.value)
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSend();
                        }
                    }}
                    placeholder="Send a message"
                    className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 outline-none"
                />

                <button
                    onClick={handleSend}
                    className="px-4 rounded-xl bg-white text-black font-medium"
                >
                    Send
                </button>
            </div>
        </div>
    );
}