"use client";

import { useMemo } from "react";
import RemoteVideo from "./RemoteVideo";

interface RemoteStreamItem {
    id: string;
    stream: MediaStream;
}

interface VideoLayoutProps {
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteStreams: RemoteStreamItem[];
}

export default function VideoLayout({
    localVideoRef,
    remoteStreams,
}: VideoLayoutProps) {
    const visibleRemotes = remoteStreams.slice(0, 5);
    const extraCount = Math.max(remoteStreams.length - 5, 0);

    const gridClass = useMemo(() => {
        const total = visibleRemotes.length;

        if (total <= 1) {
            return "grid-cols-1";
        }

        if (total <= 4) {
            return "grid-cols-2";
        }

        return "grid-cols-3";
    }, [visibleRemotes.length]);

    return (
        <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                    Janus SFU Video Conference
                </h1>

                <div className="relative min-h-[80vh] rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-2xl overflow-hidden">
                    {/* Remote users area */}
                    <div
                        className={`grid ${gridClass} gap-4 h-full auto-rows-[220px] md:auto-rows-[280px]`}
                    >
                        {visibleRemotes.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-white/20 bg-neutral-800 text-neutral-300 text-lg">
                                Waiting for participants...
                            </div>
                        ) : (
                            <>
                                {visibleRemotes.map((remote) => (
                                    <div
                                        key={remote.id}
                                        className="rounded-2xl overflow-hidden bg-black border border-white/10"
                                    >
                                        <RemoteVideo stream={remote.stream} />
                                    </div>
                                ))}

                                {extraCount > 0 && (
                                    <div className="rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center text-3xl font-bold">
                                        +{extraCount} more
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Local self view floating bottom-right */}
                    <div className="absolute bottom-5 right-5 w-[180px] md:w-[240px] rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl z-20">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        <div className="absolute bottom-2 left-2 text-xs md:text-sm font-medium bg-black/60 px-2 py-1 rounded-lg">
                            You
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
