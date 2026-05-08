"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

interface SpeakerData {
    stream: MediaStream;
    publisherId: string;
}

export function useDominantSpeaker(
    speakers: SpeakerData[]
) {
    const [activeSpeakerId, setActiveSpeakerId] =
        useState<string | null>(null);

    /**
     * Current dominant speaker
     */
    const currentSpeakerRef =
        useRef<string | null>(null);

    /**
     * Prevent rapid switching
     */
    const lastSwitchRef = useRef(0);

    /**
     * Silence timeout
     */
    const activeSpeakerTimeoutRef =
        useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const audioContexts: AudioContext[] = [];

        const animationFrames: number[] = [];

        speakers.forEach(
            ({ stream, publisherId }) => {
                const hasAudio =
                    stream.getAudioTracks().length > 0;

                if (!hasAudio) return;

                const audioContext =
                    new AudioContext();

                audioContexts.push(audioContext);

                const analyser =
                    audioContext.createAnalyser();

                analyser.fftSize = 512;

                const source =
                    audioContext.createMediaStreamSource(
                        stream
                    );

                source.connect(analyser);

                const dataArray =
                    new Uint8Array(
                        analyser.frequencyBinCount
                    );

                const checkAudio = () => {
                    analyser.getByteFrequencyData(
                        dataArray
                    );

                    const average =
                        dataArray.reduce(
                            (a, b) => a + b,
                            0
                        ) / dataArray.length;

                    /**
                     * Ignore background noise
                     */
                    const SPEAK_THRESHOLD = 20;

                    /**
                     * Prevent infinite speaker switching
                     */
                    const SWITCH_COOLDOWN = 2000;

                    const now = Date.now();

                    const canSwitch =
                        now -
                        lastSwitchRef.current >
                        SWITCH_COOLDOWN;

                    /**
                     * New dominant speaker detected
                     */
                    if (
                        average > SPEAK_THRESHOLD &&
                        currentSpeakerRef.current !==
                        publisherId &&
                        canSwitch
                    ) {
                        currentSpeakerRef.current =
                            publisherId;

                        lastSwitchRef.current = now;

                        setActiveSpeakerId(
                            publisherId
                        );
                    }

                    /**
                     * Reset silence timeout
                     */
                    if (
                        average > SPEAK_THRESHOLD &&
                        currentSpeakerRef.current ===
                        publisherId
                    ) {
                        // clear previous timeout
                        if (
                            activeSpeakerTimeoutRef.current
                        ) {
                            clearTimeout(
                                activeSpeakerTimeoutRef.current
                            );
                        }

                        // auto remove highlight after silence
                        activeSpeakerTimeoutRef.current =
                            setTimeout(() => {
                                currentSpeakerRef.current =
                                    null;

                                setActiveSpeakerId(
                                    null
                                );
                            }, 1500);
                    }

                    const frame =
                        requestAnimationFrame(
                            checkAudio
                        );

                    animationFrames.push(frame);
                };

                checkAudio();
            }
        );

        return () => {
            /**
             * cancel animation loops
             */
            animationFrames.forEach((frame) =>
                cancelAnimationFrame(frame)
            );

            /**
             * close audio contexts
             */
            audioContexts.forEach((ctx) => {
                ctx.close();
            });

            /** 
             * cleanup timeout
             */
            if (
                activeSpeakerTimeoutRef.current
            ) {
                clearTimeout(
                    activeSpeakerTimeoutRef.current
                );
            }
        };
    }, [speakers]);

    return activeSpeakerId;
}