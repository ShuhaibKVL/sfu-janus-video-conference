"use client";

import { useEffect, useRef } from "react";

export default function RemoteVideo({
    stream,
}: {
    stream: MediaStream;
}) {
    const videoRef =
        useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
        />
    );
}