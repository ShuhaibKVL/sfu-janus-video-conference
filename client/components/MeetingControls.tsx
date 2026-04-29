"use client";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    MonitorUp,
    MonitorOff,
    Hand,
    MessageSquare,
    Smile,
    Sparkles
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
    isMuted: boolean;
    isCameraOff: boolean;
    isScreenSharing: boolean;
    isChatOpened: boolean;
    toggleMic: () => void;
    toggleCamera: () => void;
    toggleScreenShare: () => void;
    stopScreenShare: () => void;
    leaveMeeting: () => void;
    raiseHand: () => void;
    toggleChat: () => void;
    sendReaction: (emoji: string) => void;
    unreadCount?: number;
    isNoiseCancellationOn: boolean;
    toggleNoiseCancellation: () => void;
};

const MeetingControls = ({
    isMuted,
    isCameraOff,
    isScreenSharing,
    isChatOpened,
    isNoiseCancellationOn,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    stopScreenShare,
    leaveMeeting,
    raiseHand,
    toggleChat,
    sendReaction,
    toggleNoiseCancellation,

    unreadCount = 0,
}: Props) => {
    const [showReactions, setShowReactions] = useState(false);
    const popupRef = useRef<HTMLDivElement | null>(null);

    const reactions = ["👍", "😂", "👏", "❤️", "😮", "🥳"];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node)
            ) {
                setShowReactions(false);
            }
        };

        if (showReactions) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showReactions]);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            {/* Reaction Popup */}
            {showReactions && (
                <div ref={popupRef} className="absolute bottom-20 left-1/2 -translate-x-1/2
                bg-slate-900/95 backdrop-blur-xl border border-slate-700
                rounded-2xl px-4 py-3 shadow-2xl
                flex gap-3 animate-in fade-in zoom-in duration-200">

                    {reactions.map((emoji, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                sendReaction(emoji);
                            }}
                            className="text-2xl hover:scale-125 transition duration-200
                            hover:bg-slate-800 rounded-xl p-2"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-black/70 backdrop-blur-xl border border-sky-400/20 shadow-2xl">
                <button
                    onClick={toggleMic}
                    className="px-5 py-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition"
                >
                    {isMuted ? (
                        <MicOff className="text-white" size={22} />
                    ) : (
                        <Mic className="text-white" size={22} />
                    )}
                </button>

                <button
                    onClick={toggleNoiseCancellation}
                    className={`px-5 py-3 rounded-2xl transition ${isNoiseCancellationOn
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-slate-800 hover:bg-slate-700"
                        }`}
                    title={
                        isNoiseCancellationOn
                            ? "Noise Cancellation ON"
                            : "Noise Cancellation OFF"
                    }
                >
                    <div className="relative">
                        <Mic size={20} />

                        {isNoiseCancellationOn && (
                            <Sparkles
                                size={12}
                                className="absolute -top-1 -right-1"
                            />
                        )}
                    </div>
                </button>

                <button
                    onClick={toggleCamera}
                    className="px-5 py-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition"
                >
                    {isCameraOff ? (
                        <VideoOff className="text-white" size={22} />
                    ) : (
                        <Video className="text-white" size={22} />
                    )}

                </button>

                {/* Screen Share */}
                <button
                    onClick={
                        isScreenSharing
                            ? stopScreenShare
                            : toggleScreenShare
                    }
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isScreenSharing
                        ? "bg-sky-500 hover:bg-sky-600"
                        : "bg-slate-800 hover:bg-slate-700"
                        }`}
                >
                    {isScreenSharing ? (
                        <MonitorOff className="text-white" size={22} />
                    ) : (
                        <MonitorUp className="text-white" size={22} />
                    )}
                </button>

                <button
                    onClick={raiseHand}
                    className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
                    title="Raise Hand"
                >
                    <Hand className="text-white" size={22} />
                </button>

                {/* Reaction Button */}
                <button
                    onClick={() => setShowReactions((prev) => !prev)}
                    className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition"
                >
                    😁
                </button>

                <div className="relative" onClick={toggleChat}>
                    <MessageSquare className="text-white" size={22} />
                    {unreadCount > 0 && !isChatOpened && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                            {unreadCount}
                        </span>
                    )}
                </div>

                <button
                    onClick={leaveMeeting}
                    className="px-5 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-500 transition"
                >
                    <PhoneOff className="text-white" size={24} />

                </button>

            </div>
        </div>
    );
};

export default MeetingControls;