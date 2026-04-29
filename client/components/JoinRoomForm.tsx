"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEXT_HANDLER_URL } from "@/lib/constants";

export default function JoinRoomForm() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [joinRoomId, setJoinRoomId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateRoom = async () => {
        if (!username.trim()) {
            alert("Enter your name");
            return;
        }

        try {
            setLoading(true);
            const { API, CREATE_ROOM } = NEXT_HANDLER_URL
            const res = await fetch(`${API}${CREATE_ROOM}`, {
                method: "POST"
            });

            const data = await res.json();

            if (!data.success) {
                alert("Failed to create room: " + data.error);
                return;
            }

            router.push(`/room/${data.roomId}?username=${encodeURIComponent(username)}`);
        } catch (error) {
            console.log("Error creating room:", error);
            alert("Error creating room: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = () => {
        if (!username.trim()) {
            alert("Enter username");
            return;
        }

        if (!joinRoomId.trim()) {
            alert("Enter room ID");
            return;
        }

        router.push(
            `/room/${joinRoomId}?username=${encodeURIComponent(username)}`
        );
    };

    return (
        <main className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
            </div>

            {/* Main Card */}
            <div className="relative w-full max-w-xl z-10">
                <div className="relative rounded-[32px]">

                    {/* Animated glow layer ONLY */}
                    <div
                        className="
                        absolute
                        inset-0
                        rounded-[32px]
                        bg-gradient-to-r
                        from-indigo-500
                        via-purple-500
                        to-pink-500
                        blur-xl
                        opacity-30
                        animate-[pulse_6s_ease-in-out_infinite]
                        -z-10
                    "
                    />

                    {/* Static border wrapper */}
                    <div
                        className="
                        relative
                        rounded-[32px]
                        p-[1.5px]
                        bg-gradient-to-r
                        from-white/20
                        via-white/40
                        to-white/20
                    "
                    >
                        {/* Actual card */}
                        <div className="rounded-[32px] bg-neutral-950 border border-white/10 px-8 py-10 md:px-10 md:py-12 shadow-2xl backdrop-blur-xl">

                            {/* Title */}
                            <h1 className="text-4xl font-bold text-center text-white mb-10 tracking-tight">
                                Janus SFU Meeting
                            </h1>

                            {/* Username Input */}
                            <input
                                placeholder="Enter your name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="
                                w-full
                                h-[60px]
                                rounded-2xl
                                bg-neutral-900
                                border border-white/10
                                px-5
                                text-white
                                placeholder:text-neutral-400
                                outline-none
                                focus:border-white/30
                                transition-all
                                duration-300
                                mb-5
                            "
                            />

                            {/* Create Room Button */}
                            <button
                                onClick={handleCreateRoom}
                                disabled={loading}
                                className="
                                group
                                relative
                                w-full
                                h-[60px]
                                rounded-2xl
                                bg-black
                                border border-white/30
                                text-white
                                font-semibold
                                text-lg
                                overflow-hidden
                                transition-all
                                duration-300
                                hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]
                                hover:scale-[1.01]
                                mb-8
                            "
                            >
                                <span className="relative z-10">
                                    {loading ? "Creating..." : "Create Room"}
                                </span>

                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-white/5" />
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex-1 h-[1px] bg-white/10" />
                                <span className="text-neutral-400 font-medium text-sm">
                                    OR
                                </span>
                                <div className="flex-1 h-[1px] bg-white/10" />
                            </div>

                            {/* Room ID Input */}
                            <input
                                placeholder="Enter Room ID"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                className="
                                w-full
                                h-[60px]
                                rounded-2xl
                                bg-neutral-900
                                border border-white/10
                                px-5
                                text-white
                                placeholder:text-neutral-400
                                outline-none
                                focus:border-white/30
                                transition-all
                                duration-300
                                mb-5
                            "
                            />

                            {/* Join Room Button */}
                            <button
                                onClick={handleJoinRoom}
                                disabled={loading}
                                className="
                                group
                                relative
                                w-full
                                h-[60px]
                                rounded-2xl
                                font-semibold
                                text-lg
                                text-white
                                overflow-hidden
                                transition-all
                                duration-300
                                hover:scale-[1.01]
                                hover:shadow-[0_0_40px_rgba(120,120,255,0.25)]
                                bg-gradient-to-r
                                from-indigo-700
                                via-indigo-600
                                to-purple-700
                            "
                            >
                                <span className="relative z-10">
                                    Join Room
                                </span>

                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-white/10" />
                            </button>

                            {/* Footer */}
                            <p className="text-center text-neutral-500 text-sm mt-8">
                                Powered by Janus SFU
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}