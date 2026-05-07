"use client";

import { memo, useEffect, useRef } from "react";

export default memo(function RemoteVideo({
    stream,
}: {
    stream: MediaStream;
}) {
    const videoRef =
        useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        /**
         * PERFORMANCE OPTIMIZATION
         */

        videoRef.current.playsInline = true;

        /**
         * Hint browser:
         * prioritize smooth playback over quality
         */
        videoRef.current.setAttribute(
            "playsinline",
            "true"
        );

        /**
         * Safari + mobile optimization
         */
        videoRef.current.disablePictureInPicture = true;

    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            preload="none"
            className="w-full h-full object-cover will-change-transform transform-gpu"
        />
    );
});