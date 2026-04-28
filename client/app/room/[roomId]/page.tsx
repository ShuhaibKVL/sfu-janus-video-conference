"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Janus from "janus-gateway";
import adapter from "webrtc-adapter";
import VideoLayout from "@/components/VideoLayout";

declare global {
    interface Window {
        adapter: any;
    }
}

export default function RoomPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const roomId = 1234//Number(params.roomId);
    console.log('Room ID:', roomId);
    const username =
        searchParams.get("username") || "Guest";

    const localVideoRef =
        useRef<HTMLVideoElement | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<{ id: string; stream: MediaStream }[]>(
            []
        );

    const janusRef = useRef<any>(null);

    const subscribeToPublisher = (
        publisherId: number
    ) => {
        let subscriberHandle: any;

        janusRef.current.attach({
            plugin: "janus.plugin.videoroom",

            success: (pluginHandle: any) => {
                console.log("Attached to plugin for subscribing with handle ID:", pluginHandle.getId());
                subscriberHandle = pluginHandle;

                subscriberHandle.send({
                    message: {
                        request: "join",
                        room: roomId,
                        ptype: "subscriber",
                        feed: publisherId,
                    },
                });
            },

            onmessage: (msg: any, jsep: any) => {
                console.log("Received message for subscriber:", msg);
                if (jsep) {
                    subscriberHandle.createAnswer({
                        jsep,

                        media: {
                            audioSend: false,
                            videoSend: false,
                            audioRecv: true,
                            videoRecv: true,
                        },

                        success: (jsep: any) => {
                            subscriberHandle.send({
                                message: {
                                    request: "start",
                                    room: roomId,
                                },
                                jsep,
                            });
                        },
                    });
                }
            },

            onremotetrack: (
                track: MediaStreamTrack,
                mid: string,
                on: boolean
            ) => {
                console.log("Received remote track for subscriber:", track, "mid:", mid, "on:", on);
                if (
                    track.kind === "video" &&
                    on
                ) {
                    const remoteStream =
                        new MediaStream([track]);

                    setRemoteStreams((prev) => {
                        const uniqueId =
                            publisherId.toString();

                        const exists = prev.find(
                            (item) => item.id === uniqueId
                        );

                        if (exists) return prev;

                        return [
                            ...prev,
                            {
                                id: uniqueId,
                                stream: remoteStream,
                            },
                        ];
                    });
                }
            },
        });
    };

    const startJanus = () => {
        console.log("Starting Janus with room ID:", roomId, "and username:", username);
        janusRef.current = new Janus({
            server: "ws://localhost:8188",

            success: () => {
                let publisherHandle: any;

                janusRef.current.attach({
                    plugin: "janus.plugin.videoroom",

                    success: (pluginHandle: any) => {
                        console.log("Attached to plugin with handle ID:", pluginHandle.getId());
                        publisherHandle = pluginHandle;

                        pluginHandle.send({
                            message: {
                                request: "join",
                                room: roomId,
                                ptype: "publisher",
                                display: username,
                            },
                        });
                    },

                    error: (error: any) => {
                        console.error(" Janus plugin connection error :", error);
                    },

                    onmessage: (msg: any, jsep: any) => {
                        console.log("Received message from Janus:", msg);
                        if (jsep) {
                            console.log("Received JSEP:", jsep);
                            publisherHandle.handleRemoteJsep({
                                jsep,
                            });
                        }

                        if (msg.videoroom === "joined") {
                            console.log("Successfully joined room:", msg.room);
                            if (
                                msg.publishers &&
                                msg.publishers.length > 0
                            ) {
                                console.log("Existing publishers in the room:", msg.publishers);
                                msg.publishers.forEach(
                                    (publisher: any) => {
                                        subscribeToPublisher(
                                            publisher.id
                                        );
                                    }
                                );
                            }

                            publisherHandle.createOffer({
                                tracks: [
                                    {
                                        type: "audio",
                                        capture: true,
                                        recv: false,
                                    },
                                    {
                                        type: "video",
                                        capture: true,
                                        recv: false,
                                    },
                                ],

                                success: (jsep: any) => {
                                    console.log("Created local offer:", jsep);
                                    publisherHandle.send({
                                        message: {
                                            request: "publish",
                                            audio: true,
                                            video: true,
                                        },
                                        jsep,
                                    });
                                },
                            });
                        }

                        if (
                            msg.videoroom === "event" &&
                            msg.publishers
                        ) {
                            console.log("New publishers joined the room:", msg.publishers);
                            msg.publishers.forEach(
                                (publisher: any) => {
                                    subscribeToPublisher(
                                        publisher.id
                                    );
                                }
                            );
                        }
                    },

                    onlocaltrack: (
                        track: MediaStreamTrack,
                        on: boolean
                    ) => {
                        console.log("Received local track:", track, "on:", on);
                        if (track.kind === "video" && on) {
                            const localStream =
                                new MediaStream([track]);

                            if (localVideoRef.current) {
                                localVideoRef.current.srcObject =
                                    localStream;
                            }
                        }
                    },
                });
            },
        });
    };

    useEffect(() => {
        window.adapter = adapter;

        Janus.init({
            debug: "all",
            callback: () => {
                startJanus();
            },
        });
    }, []);

    return (
        <VideoLayout
            localVideoRef={localVideoRef}
            remoteStreams={remoteStreams}
        />
    );
}