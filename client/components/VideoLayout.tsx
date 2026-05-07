"use client";

import { useMemo, useState } from "react";
import RemoteVideo from "./RemoteVideo";
import { MAX_VISIBLE_STREAMS } from "@/lib/constants";
import MeetingControls from "./MeetingControls";
import { IReaction } from "@/types/socket.types";
import { IChatMessage } from "@/types/chat.types";
import ChatPanel from "./ChatPanel";

interface RemoteStreamItem {
    id: string;
    stream: MediaStream;
    name: string;
    isCameraOff: boolean;
}

interface VideoLayoutProps {
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteStreams: RemoteStreamItem[];
    roomId: string;
    leaveMeeting: () => void;
    startScreenShare: () => void;
    stopScreenShare: () => void;
    raiseHand: () => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    handleReaction: (emoji: string) => void;
    raisedHandsSet: Set<string>;
    sharedScreen: {
        id: string;
        stream: MediaStream;
        name: string;
    } | null;
    isScreenSharing: boolean;
    myPublisherId: number | null;
    reactions: IReaction[];
    isMuted: boolean;
    isCameraOff: boolean;

    // chat related props can be added here later
    messages: IChatMessage[];
    sendMessage: (message: string) => void;
    isChatOpen: boolean;
    setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function VideoLayout({
    localVideoRef,
    remoteStreams,
    roomId,
    leaveMeeting,
    sharedScreen,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    raiseHand,
    handleReaction,
    raisedHandsSet,
    myPublisherId,
    reactions,
    toggleMic,
    toggleCamera,
    isMuted,
    isCameraOff,
    messages,
    sendMessage,
    isChatOpen,
    setIsChatOpen,
    unreadCount,
    setUnreadCount
}: VideoLayoutProps) {
    const [showAllParticipants, setShowAllParticipants] =
        useState(false);

    const hasExtraUsers =
        remoteStreams.length > MAX_VISIBLE_STREAMS;

    /**
     * If extra users exist:
     * reserve last slot for "+X more"
     */

    const visibleRemotes = hasExtraUsers
        ? remoteStreams.slice(0, MAX_VISIBLE_STREAMS - 1)
        : remoteStreams.slice(0, MAX_VISIBLE_STREAMS);

    const extraCount = hasExtraUsers
        ? remoteStreams.length - visibleRemotes.length
        : 0;

    const copyRoomId = async () => {
        await navigator.clipboard.writeText(
            roomId.toString()
        );
    };

    const isMyHandRaised = myPublisherId
        ? raisedHandsSet.has(myPublisherId.toString())
        : false;

    const gridClass = useMemo(() => {
        const total = visibleRemotes.length;

        if (total <= 1) {
            return "grid-cols-1 h-full";
        }

        if (total <= 2) {
            return "grid-cols-2 h-full";
        }

        if (total <= 3) {
            return "grid-cols-3 h-full";
        }

        if (total <= 6) {
            return "grid-cols-2 md:grid-cols-3";
        }

        return "grid-cols-2 md:grid-cols-3";
    }, [visibleRemotes.length]);

    if (showAllParticipants) {
        return (
            <main className="min-h-screen bg-black text-white p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold">
                            All Participants
                        </h1>

                        <button
                            onClick={() =>
                                setShowAllParticipants(false)
                            }
                            className="px-5 py-2 rounded-xl border border-white/20 hover:bg-white/10"
                        >
                            Back
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        {remoteStreams.map((remote) => (
                            <div
                                key={remote.id}
                                className="rounded-2xl overflow-hidden bg-neutral-900 border border-white/10"
                            >
                                <div className="relative">
                                    <RemoteVideo
                                        stream={remote.stream}
                                    />

                                    <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-sm">
                                        {remote.name ||
                                            `User ${remote.id}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="h-screen flex bg-black overflow-hidden">
            {/* Reactions */}
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                {reactions.map((r) => (
                    <div
                        key={r.id}
                        className="absolute bottom-10 flex flex-col items-center animate-float"
                        style={{
                            left: `${r.left}%`,
                        }}
                    >
                        {/* Emoji */}
                        <div className="text-4xl drop-shadow-lg">
                            {r.emoji}
                        </div>

                        {/* Username */}
                        {r?.userName && r?.userName?.trim() !== "" && (
                            <div className="text-[10px] max-w-[80px] truncate mt-1 px-2 py-[2px] rounded bg-black/60 text-white whitespace-nowrap">
                                {r?.userName}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div
                className={`
        flex-1 transition-all duration-300
        ${isChatOpen ? "max-w-[calc(100%-340px)]" : "w-full"}
    `}
            >
                {sharedScreen ? (
                    <main className="h-screen bg-black text-white p-4 md:p-6 overflow-hidden">
                        <div className="max-w-7xl mx-auto h-full flex flex-col">
                            <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
                                Janus SFU Video Conference
                            </h1>

                            <div
                                className={`flex flex-1 gap-4 min-h-0${isChatOpen ? "pr-2" : ""}`}>
                                {/* LEFT : SHARED SCREEN */}
                                <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10 bg-black">
                                    <RemoteVideo stream={sharedScreen.stream} />

                                    <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-xl text-sm font-medium">
                                        {sharedScreen.name} is presenting
                                    </div>
                                </div>

                                {/* RIGHT : REMOTE USERS */}
                                <div className="w-[280px] flex flex-col gap-4">
                                    {visibleRemotes
                                        .filter(
                                            (remote) =>
                                                remote.id !== sharedScreen.id
                                        )
                                        .slice(0, 2)
                                        .map((remote) => {
                                            return (
                                                <div
                                                    key={remote.id}
                                                    className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black"
                                                >

                                                    {raisedHandsSet.has(remote.id) && (
                                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-lg text-xs font-bold">
                                                            ✋
                                                        </div>
                                                    )}

                                                    {remote.isCameraOff ? (
                                                        <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white">
                                                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                                                {remote.name?.charAt(0)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <RemoteVideo stream={remote.stream} />
                                                    )}

                                                    <div className="absolute top-2 left-2 bg-black/60 px-3 py-1 rounded-lg text-sm">
                                                        {remote.name}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>

                            {/* LOCAL SELF VIEW */}
                            <div
                                className={`
                                    absolute bottom-28 z-20
                                    rounded-2xl overflow-hidden
                                    border border-white/20
                                    bg-black shadow-2xl
                                    transition-all duration-300
                                    w-[180px] md:w-[220px]
                                    ${isChatOpen ? "right-2 md:right-4" : "right-8"}
    `                           }
                            >
                                {isCameraOff ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center text-white text-sm">
                                        Camera Off
                                    </div>
                                ) : (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                <div className="absolute bottom-2 left-2 text-xs md:text-sm font-medium bg-black/60 px-2 py-1 rounded-lg">
                                    You
                                </div>
                            </div>
                        </div>
                    </main>
                ) : (
                    <main className="h-screen bg-black text-white p-4 md:p-6 overflow-hidden">
                        <div className="max-w-7xl mx-auto h-full">
                            <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
                                Janus SFU Video Conference
                            </h1>

                            <div className="relative h-[82vh] rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-2xl overflow-hidden">
                                {visibleRemotes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div className="w-full h-[320px] rounded-3xl border border-dashed border-white/20 bg-neutral-800 flex items-center justify-center text-neutral-300 text-lg">
                                            Waiting for participants...
                                        </div>

                                        <div className="mt-8 text-center">
                                            <p className="text-lg font-semibold mb-3">
                                                Room ID: {roomId}
                                            </p>

                                            <button
                                                onClick={copyRoomId}
                                                className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-[1.02] transition"
                                            >
                                                Copy Room ID
                                            </button>

                                            <p className="text-neutral-400 text-sm mt-4">
                                                Share this Room ID with your participants
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`grid ${gridClass} gap-4 h-full`}
                                    >
                                        {visibleRemotes.map((remote) => (
                                            <div
                                                key={remote.id}
                                                className={`relative rounded-2xl overflow-hidden bg-black border border-white/10 ${visibleRemotes.length === 1
                                                    ? "h-full"
                                                    : "h-full"
                                                    }`}
                                            >

                                                {raisedHandsSet.has(remote.id) && (
                                                    <div className="absolute top-2 right-2 z-20 text-black px-2 py-1 rounded-lg text-md font-bold">
                                                        ✋
                                                    </div>
                                                )}

                                                {remote.isCameraOff ? (
                                                    <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white">
                                                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                                            {remote.name?.charAt(0)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <RemoteVideo stream={remote.stream} />
                                                )}

                                                <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-sm font-medium">
                                                    {remote.name ||
                                                        `User ${remote.id}`}
                                                </div>
                                            </div>
                                        ))}

                                        {extraCount > 0 && (
                                            <button
                                                onClick={() =>
                                                    setShowAllParticipants(true)
                                                }
                                                className="rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center text-3xl font-bold hover:bg-neutral-700 transition"
                                            >
                                                +{extraCount} more
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* LOCAL SELF VIEW */}
                                <div className="absolute bottom-5 right-5 w-[180px] md:w-[220px] rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl z-20">
                                    {isCameraOff ? (
                                        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-white text-sm">
                                            Camera Off
                                        </div>
                                    ) : (
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                    <div className="absolute bottom-2 left-2 text-xs md:text-sm font-medium bg-black/60 px-2 py-1 rounded-lg">
                                        You
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                )}
            </div>
            {isChatOpen && (
                <ChatPanel
                    messages={messages}
                    sendMessage={sendMessage}
                />
            )}
            <MeetingControls
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                isScreenSharing={isScreenSharing}
                isChatOpened={isChatOpen}
                isNoiseCancellationOn={false}
                isHandRaised={isMyHandRaised}
                unreadCount={unreadCount}
                toggleMic={toggleMic}
                toggleCamera={toggleCamera}
                toggleScreenShare={startScreenShare}
                stopScreenShare={stopScreenShare}
                raiseHand={raiseHand}
                toggleChat={() => {
                    setIsChatOpen((prev) => {
                        const next = !prev;

                        if (!prev) {
                            setUnreadCount(0);
                        }

                        return next;
                    });
                }}
                sendReaction={handleReaction}
                toggleNoiseCancellation={() => { }}
                leaveMeeting={leaveMeeting}
            />
        </div>
    );
}
