"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LS_KEYS, NEXT_HANDLER_URL } from "@/lib/constants";
import DeviceSetupModal from "./DeviceSetupModal";

export default function HomePage() {

    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    const [joinRoomId, setJoinRoomId] = useState("");
    const [loading, setLoading] = useState(false);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const [showDeviceModal, setShowDeviceModal] =
        useState(false);

    const [pendingAction, setPendingAction] =
        useState<"create" | "join" | null>(null);

    useEffect(() => {

        const user = localStorage.getItem("user");

        if (user) {
            const parsedUser = JSON.parse(user);

            setUsername(parsedUser.name);
            setEmail(parsedUser.email);
        }

    }, []);

    /**
     * CLOSE DROPDOWN ON OUTSIDE CLICK
     */
    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);

    /**
     * CREATE ROOM
     */
    const handleCreateRoom = async () => {
        try {
            setLoading(true);

            const { API, CREATE_ROOM } = NEXT_HANDLER_URL;

            const res = await fetch(`${API}${CREATE_ROOM}`, {
                method: "POST",
            });

            const data = await res.json();

            if (!data.success) {
                alert(data.error);
                return;
            }

            router.push(
                `/room/${data.roomId}?username=${encodeURIComponent(username)}`
            );

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);
        }
    };

    /**
     * JOIN ROOM
     */
    const handleJoinRoom = () => {

        if (!joinRoomId.trim()) {
            alert("Enter Room ID");
            return;
        }

        router.push(
            `/room/${joinRoomId}?username=${encodeURIComponent(username)}`
        );
    };

    /**
     * LOGOUT
     */
    const handleLogout = async () => {

        try {

            await fetch("/api/user/logout", {
                method: "POST",
            });

            localStorage.removeItem("user");

            router.push("/login");

        } catch (error) {

            console.error(error);
        }
    };

    return (
        <main className="min-h-screen bg-black overflow-hidden">

            {/* BACKGROUND GLOW */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />

                <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            {/* HEADER */}
            <header className="relative z-50 h-[80px] border-b border-white/10 bg-black/70 backdrop-blur-xl px-8 flex items-center justify-between">

                {/* LOGO */}
                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold">
                        J
                    </div>

                    <h1 className="text-white text-2xl font-bold">
                        Janus SFU
                    </h1>
                </div>

                {/* USER PROFILE */}
                <div
                    ref={dropdownRef}
                    className="relative"
                >

                    <button
                        onClick={() =>
                            setDropdownOpen(!dropdownOpen)
                        }
                        className="
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2
                            rounded-2xl
                            hover:bg-white/5
                            transition-all
                        "
                    >

                        {/* AVATAR */}
                        <div className="
                            w-12
                            h-12
                            rounded-full
                            bg-gradient-to-r
                            from-indigo-600
                            to-purple-700
                            flex
                            items-center
                            justify-center
                            text-white
                            font-bold
                            text-lg
                        ">
                            {username?.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="text-left">
                            <p className="text-white font-semibold">
                                {username}
                            </p>

                            <p className="text-neutral-400 text-sm">
                                Online
                            </p>
                        </div>

                    </button>

                    {/* DROPDOWN */}
                    {
                        dropdownOpen && (
                            <div className="
                                absolute
                                right-0
                                top-[70px]
                                w-[320px]
                                rounded-3xl
                                border
                                border-white/10
                                bg-neutral-950
                                backdrop-blur-xl
                                p-6
                                shadow-2xl
                            ">

                                <div className="flex items-center gap-4 mb-6">

                                    <div className="
                                        w-16
                                        h-16
                                        rounded-full
                                        bg-gradient-to-r
                                        from-indigo-600
                                        to-purple-700
                                        flex
                                        items-center
                                        justify-center
                                        text-white
                                        text-2xl
                                        font-bold
                                    ">
                                        {username?.slice(0, 2).toUpperCase()}
                                    </div>

                                    <div>
                                        <h2 className="text-white text-xl font-bold">
                                            {username}
                                        </h2>

                                        <p className="text-neutral-400">
                                            {email}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-5">

                                    <button
                                        onClick={handleLogout}
                                        className="
                                            w-full
                                            h-[54px]
                                            rounded-2xl
                                            bg-red-500/10
                                            border
                                            border-red-500/20
                                            text-red-400
                                            font-semibold
                                            hover:bg-red-500/20
                                            transition-all
                                        "
                                    >
                                        Logout
                                    </button>

                                </div>
                            </div>
                        )
                    }
                </div>
            </header>

            {/* CENTER CONTENT */}
            <section className="relative flex items-center justify-center px-4 py-16">

                <div className="relative w-full max-w-xl">

                    {/* GLOW */}
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
                            animate-pulse
                            -z-10
                        "
                    />

                    {/* CARD */}
                    <div className="
                        rounded-[32px]
                        border
                        border-white/10
                        bg-neutral-950
                        px-8
                        py-10
                    ">

                        <h1 className="
                            text-5xl
                            font-bold
                            text-center
                            text-white
                            mb-3
                        ">
                            Janus SFU Meeting
                        </h1>

                        <p className="
                            text-center
                            text-neutral-400
                            mb-10
                        ">
                            Seamless real-time conferencing
                        </p>

                        {/* CREATE ROOM */}
                        <button
                            onClick={() => {
                                setPendingAction("create");
                                setShowDeviceModal(true);
                            }}
                            disabled={loading}
                            className="
                                w-full
                                h-[60px]
                                rounded-2xl
                                border
                                border-white/20
                                text-white
                                font-semibold
                                text-lg
                                hover:bg-white/5
                                transition-all
                                mb-8
                            "
                        >
                            {
                                loading
                                    ? "Creating..."
                                    : "Create Room"
                            }
                        </button>

                        {/* DIVIDER */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 h-[1px] bg-white/10" />

                            <span className="text-neutral-400">
                                OR
                            </span>

                            <div className="flex-1 h-[1px] bg-white/10" />
                        </div>

                        {/* ROOM INPUT */}
                        <input
                            placeholder="Enter Room ID"
                            value={joinRoomId}
                            onChange={(e) =>
                                setJoinRoomId(e.target.value)
                            }
                            className="
                                w-full
                                h-[60px]
                                rounded-2xl
                                bg-neutral-900
                                border
                                border-white/10
                                px-5
                                text-white
                                outline-none
                                mb-5
                            "
                        />

                        {/* JOIN ROOM */}
                        <button
                            onClick={() => {
                                setPendingAction("join");
                                setShowDeviceModal(true);
                            }}
                            className="
                                w-full
                                h-[60px]
                                rounded-2xl
                                bg-gradient-to-r
                                from-indigo-600
                                to-purple-700
                                text-white
                                font-semibold
                                text-lg
                                hover:scale-[1.01]
                                transition-all
                            "
                        >
                            Join Room
                        </button>

                    </div>
                </div>
            </section>
            <DeviceSetupModal
                isOpen={showDeviceModal}
                onClose={() => setShowDeviceModal(false)}
                onContinue={(deviceData) => {

                    localStorage.setItem(
                        LS_KEYS.DEVICE_SETUP,
                        JSON.stringify(deviceData)
                    );

                    setShowDeviceModal(false);

                    if (pendingAction === "create") {
                        handleCreateRoom();
                    }

                    if (pendingAction === "join") {
                        handleJoinRoom();
                    }
                }}
            />
        </main>
    );
}