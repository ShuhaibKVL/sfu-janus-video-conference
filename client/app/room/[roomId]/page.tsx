"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
    const router = useRouter();
    const searchParams = useSearchParams();

    const roomId = Number(params.roomId);
    const username =
        searchParams.get("username") || "Guest";

    const localVideoRef =
        useRef<HTMLVideoElement | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<{ id: string; stream: MediaStream, name: string }[]>(
            []
        );

    const janusRef = useRef<any>(null);
    const publisherRef = useRef<any>(null);
    const subscriberRefs = useRef<any[]>([]);
    const subscribedFeeds =
        useRef<Set<number>>(new Set());

    const [isScreenSharing, setIsScreenSharing] =
        useState(false);
    const [screenShareStream, setScreenShareStream] =
        useState<MediaStream | null>(null);
    const screenPublisherRef = useRef<any>(null);
    const [sharedScreen, setSharedScreen] =
        useState<{
            id: string;
            stream: MediaStream;
            name: string;
        } | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const subscribeToPublisher = (
        publisherId: number,
        publisherName: string
    ) => {
        let subscriberHandle: any;

        janusRef.current.attach({
            plugin: "janus.plugin.videoroom",

            success: (pluginHandle: any) => {
                console.log("Attached to plugin for subscribing with handle ID:", pluginHandle.getId());
                subscriberHandle = pluginHandle;
                subscriberRefs.current.push(pluginHandle);

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
                if (on) {
                    const uniqueId = publisherId.toString();
                    const isScreenShare =
                        publisherName.endsWith("'s screen");

                    if (isScreenShare) {
                        setSharedScreen((prev) => {
                            if (prev?.id === uniqueId) return prev;

                            const stream = new MediaStream();
                            stream.addTrack(track);

                            return {
                                id: uniqueId,
                                stream,
                                name: publisherName.replace("_screen", ""),
                            };
                        });

                        return;
                    }

                    setRemoteStreams((prev) => {
                        const existing = prev.find(
                            (item) => item.id === uniqueId
                        );

                        if (existing) {
                            existing.stream.addTrack(track);
                            return [...prev];
                        }

                        const remoteStream = new MediaStream();
                        remoteStream.addTrack(track);

                        return [
                            ...prev,
                            {
                                id: uniqueId,
                                stream: remoteStream,
                                name: publisherName,
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
                        publisherRef.current = pluginHandle;

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

                        if (msg.error) {
                            console.error(
                                "Janus room error:",
                                msg.error
                            );

                            alert(
                                "Room not found or invalid room ID"
                            );

                            return;
                        }

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
                                        if (!subscribedFeeds.current.has(publisher.id)) {

                                            subscribedFeeds.current.add(publisher.id);

                                            subscribeToPublisher(
                                                publisher.id,
                                                publisher.display
                                            );
                                        }
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
                                    const isMyScreen = publisher.display === `${username}'s screen`;

                                    if (isMyScreen) {
                                        return;
                                    }

                                    if (
                                        !subscribedFeeds.current.has(
                                            publisher.id
                                        )
                                    ) {
                                        subscribedFeeds.current.add(
                                            publisher.id
                                        );

                                        subscribeToPublisher(
                                            publisher.id,
                                            publisher.display
                                        );
                                    }
                                }
                            );
                        }

                        if (
                            msg.videoroom === "event" &&
                            msg.leaving
                        ) {
                            const leavingId = msg.leaving.toString();

                            subscribedFeeds.current.delete(
                                Number(msg.leaving)
                            );

                            setRemoteStreams((prev) =>
                                prev.filter(
                                    (item) => item.id !== leavingId
                                )
                            );

                            setSharedScreen((prev) => {
                                if (prev?.id === leavingId) {
                                    return null;
                                }
                                return prev;
                            });
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

                            // if (localVideoRef.current) {
                            //     localVideoRef.current.srcObject =
                            //         localStream;
                            // }
                            setLocalStream(localStream);
                        }
                    },
                });
            },
        });
    };

    const leaveMeeting = async () => {
        try {
            /**
             * Stop local tracks
             */
            if (localVideoRef.current?.srcObject) {
                const localStream =
                    localVideoRef.current.srcObject as MediaStream;

                localStream.getTracks().forEach((track) =>
                    track.stop()
                );

                localVideoRef.current.srcObject = null;
            }

            /**
             * Leave publisher
             */
            if (publisherRef.current) {
                publisherRef.current.send({
                    message: {
                        request: "leave",
                    },
                });

                publisherRef.current.hangup();
                publisherRef.current.detach();
                publisherRef.current = null;
            }

            /**
             * Leave all subscribers
             */
            subscriberRefs.current.forEach((subscriber) => {
                try {
                    subscriber.send({
                        message: {
                            request: "leave",
                        },
                    });

                    subscriber.hangup();
                    subscriber.detach();
                } catch (error) {
                    console.error(error);
                }
            });

            subscriberRefs.current = [];

            /**
             * Destroy Janus session
             */
            if (janusRef.current) {
                janusRef.current.destroy();
                janusRef.current = null;
            }

            /**
             * Clear UI
             */
            setRemoteStreams([]);

            /**
             * Redirect
             */
            router.push("/");
        } catch (error) {
            console.error("Leave meeting error:", error);
        }
    };

    useEffect(() => {
        window.adapter = adapter;

        Janus.init({
            debug: "all",
            callback: () => {
                startJanus();
            },
        });

        const cleanupJanus = () => {
            console.log("Destroying Janus session...");

            if (janusRef.current) {
                try {
                    janusRef.current.destroy({
                        cleanupHandles: true,
                        notifyDestroyed: true,
                        unload: true,
                        success: () => {
                            console.log("Janus destroyed successfully");
                        },
                        error: (err: any) => {
                            console.error("Destroy Janus error:", err);
                        },
                    });
                } catch (error) {
                    console.error("Cleanup failed:", error);
                }
            }
        };

        window.addEventListener("beforeunload", cleanupJanus);

        return () => {
            leaveMeeting();
            window.removeEventListener("beforeunload", cleanupJanus);
        };
    }, []);

    useEffect(() => {
        if (
            localVideoRef.current &&
            localStream &&
            localVideoRef.current.srcObject !== localStream
        ) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, sharedScreen]);

    const stopScreenShare = () => {
        if (screenShareStream) {
            screenShareStream
                .getTracks()
                .forEach((track) => track.stop());
        }

        if (screenPublisherRef.current) {
            screenPublisherRef.current.send({
                message: {
                    request: "leave",
                },
            });

            screenPublisherRef.current.detach();
            screenPublisherRef.current = null;
        }

        setScreenShareStream(null);
        setIsScreenSharing(false);
    };

    const startScreenShare = async () => {
        try {
            if (screenPublisherRef.current) {
                alert("You are already sharing your screen");
                return;
            }

            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });

            setScreenShareStream(displayStream);
            setIsScreenSharing(true);

            janusRef.current.attach({
                plugin: "janus.plugin.videoroom",

                success: (pluginHandle: any) => {
                    console.log("Attached to plugin for screen sharing with handle ID:", pluginHandle.getId());
                    screenPublisherRef.current = pluginHandle;

                    pluginHandle.send({
                        message: {
                            request: "join",
                            room: roomId,
                            ptype: "publisher",
                            display: `${username}'s screen`,
                        },
                    });
                },

                onmessage: (msg: any, jsep: any) => {
                    console.log("Received message for screen sharing plugin:", msg);
                    if (jsep) {
                        screenPublisherRef.current.handleRemoteJsep({
                            jsep,
                        });
                    }

                    if (msg.videoroom === "joined") {
                        screenPublisherRef.current.createOffer({
                            tracks: [
                                {
                                    type: "video",
                                    capture: displayStream.getVideoTracks()[0],
                                    recv: false,
                                    simulcast: false,
                                }
                            ],

                            success: (jsep: any) => {
                                console.log("Created offer for screen sharing:", jsep);
                                screenPublisherRef.current.send({
                                    message: {
                                        request: "publish",
                                        audio: false,
                                        video: true,
                                    },
                                    jsep,
                                });
                            },

                            error: (error: any) => {
                                console.error("Screen share offer error:", error);
                            }
                        });
                    }
                },
            });

            displayStream.getVideoTracks()[0].onended =
                () => {
                    stopScreenShare();
                };

        } catch (error) {
            console.error("Screen share error:", error);
            alert("Failed to start screen sharing: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    return (
        <VideoLayout
            localVideoRef={localVideoRef}
            remoteStreams={remoteStreams}
            roomId={roomId.toString()}
            leaveMeeting={leaveMeeting}
            sharedScreen={sharedScreen}
            startScreenShare={startScreenShare}
            stopScreenShare={stopScreenShare}
            isScreenSharing={isScreenSharing}
        />
    );
}