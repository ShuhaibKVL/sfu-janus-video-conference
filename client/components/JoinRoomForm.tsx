"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoomForm() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");

    const createRoom = () => {
        if (!username.trim()) {
            alert("Enter your name");
            return;
        }

        const newRoomId = Math.floor(
            1000 + Math.random() * 9000
        ).toString();

        router.push(
            `/room/${newRoomId}?username=${username}`
        );
    };

    const joinRoom = () => {
        if (!username.trim() || !roomId.trim()) {
            alert("Enter name and room ID");
            return;
        }

        router.push(
            `/room/${roomId}?username=${username}`
        );
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-[2/4] max-w-md bg-neutral-900 rounded-3xl p-8 shadow-2xl border border-white/10">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Janus Video Meeting
                </h1>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        className="w-full p-4 rounded-xl bg-neutral-800 outline-none"
                    />

                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) =>
                            setRoomId(e.target.value)
                        }
                        className="w-full p-4 rounded-xl bg-neutral-800 outline-none"
                    />

                    <button
                        onClick={createRoom}
                        className="w-full p-4 rounded-xl bg-blue-600 font-semibold"
                    >
                        Create New Room
                    </button>

                    <button
                        onClick={joinRoom}
                        className="w-full p-4 rounded-xl bg-green-600 font-semibold"
                    >
                        Join Existing Room
                    </button>
                </div>
            </div>
        </main>
    );
}