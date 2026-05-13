"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Janus from "janus-gateway";
import adapter from "webrtc-adapter";
import VideoLayout from "@/components/VideoLayout.component";
import { useSocket } from "@/hooks/useSocket";
import { LS_KEYS, SOCKET_EVENTS } from "@/lib/constants";
import { IReaction } from "@/types/socket.types";
import { IChatMessage } from "@/types/chat.types";
import { useDominantSpeaker } from "@/hooks/useDominantSpeacker";
import { getAuthenticatedUserId } from "@/lib/utils";


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

    // Get authenticated user ID
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
        const id = getAuthenticatedUserId();
        setUserId(id);
    }, []);

    // Initialize device settings from localStorage with proper timing
    const getInitialDevices = () => {
        const data = localStorage.getItem(LS_KEYS.DEVICE_SETUP);
        if (data) {
            return JSON.parse(data);
        }
        return { cameraEnabled: true, micEnabled: true };
    };

    const initialDevices = getInitialDevices();

    const [parsedDevices, setParsedDevices] = useState(initialDevices);
    
    useEffect(() => {
        const data = localStorage.getItem(LS_KEYS.DEVICE_SETUP);
        if (data) {
            setParsedDevices(JSON.parse(data));
        }
    }, []);

    const { emitRaiseHand, socket, isConnected } = useSocket(roomId, username);
    const localVideoRef =
        useRef<HTMLVideoElement | null>(null);

    const [remoteStreams, setRemoteStreams] =
        useState<{ id: string; stream: MediaStream, name: string, isCameraOff: boolean }[]>(
            []
        );
    const [prioritySpeakerId, setPrioritySpeakerId] =
        useState<string | null>(null);
    const [visibleStreamIds, setVisibleStreamIds] =
        useState<string[]>([]);

    const janusRef = useRef<any>(null);
    const publisherRef = useRef<any>(null);
    const subscriberRefs = useRef<Map<number, any>>(new Map());
    const publisherIdRef = useRef<number | null>(null);
    const subscribedFeeds =
        useRef<Set<number>>(new Set());
    const lastDominantSwitchRef = useRef(0);

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
    const [raisedHandsSet, setRaisedHandsSet] = useState<Set<string>>(new Set());
    const [reactions, setReactions] = useState<
        IReaction[]
    >([]);
    const [isMuted, setIsMuted] = useState(!initialDevices.micEnabled);
    const [isCameraOff, setIsCameraOff] = useState(!initialDevices.cameraEnabled);
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationAudioRef =
        useRef<HTMLAudioElement | null>(null);
    const isChatOpenRef = useRef(false);
    const speakerStreams = remoteStreams.map(
        (remote) => ({
            stream: remote.stream,
            publisherId: remote.id,
        })
    );
    const activeSpeakerId =
        useDominantSpeaker(speakerStreams);

    useEffect(() => {
        if (!activeSpeakerId) return;

        /**
         * Is already visible?
         */
        const isAlreadyVisible =
            visibleStreamIds.includes(activeSpeakerId);

        if (isAlreadyVisible) return;

        /**
         * Prevent rapid layout switching
         */
        const now = Date.now();

        const SWITCH_COOLDOWN = 8000;

        if (
            now - lastDominantSwitchRef.current <
            SWITCH_COOLDOWN
        ) {
            return;
        }

        lastDominantSwitchRef.current = now;

        /**
         * Promote hidden speaker
         */
        setPrioritySpeakerId(activeSpeakerId);

    }, [activeSpeakerId, visibleStreamIds]);

    // ------------------  ---  --------------------

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
                subscriberRefs.current.set(publisherId, pluginHandle);

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
                            return prev;
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

    // device setup and permissions
    const createLocalMediaStream = async () => {

        try {
            // ALlways get both
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: parsedDevices?.cameraId
                            ? {
                                exact: parsedDevices.cameraId
                            }
                            : undefined
                    },

                    audio: {
                        deviceId: parsedDevices?.micId
                            ? {
                                exact: parsedDevices.micId
                            }
                            : undefined
                    }
                });

            if (!parsedDevices?.cameraEnabled) {
                stream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                });
            }

            if (!parsedDevices?.micEnabled) {
                stream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
            }

            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            return stream;

        } catch (error) {

            console.error("Media stream error:", error);

            alert("Failed to access camera/microphone");

            return null;
        }
    };

    const startJanus = async () => {
        console.log("Starting Janus with room ID:", roomId, "and username:", username);
        janusRef.current = new Janus({
            server: "ws://localhost:8188",

            success: async () => {
                const mediaStream =
                    await createLocalMediaStream();

                if (!mediaStream) return;

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
                            const publisherId = msg?.id; // Janus ID
                            publisherIdRef.current = msg?.id; // ALWAYS set this 

                            // send to socket server
                            if (socket?.connected) {
                                socket.emit(SOCKET_EVENTS.REGISTER_USER, {
                                    roomId,
                                    publisherId,
                                    username,
                                });
                            }

                            if (
                                msg.publishers &&
                                msg.publishers.length > 0
                            ) {
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
                                // tracks: [
                                //     {
                                //         type: "audio",
                                //         capture: true,
                                //         recv: false,
                                //     },
                                //     {
                                //         type: "video",
                                //         capture: { // user send 640x360 15 FPS stable
                                //             width: { ideal: 640 },
                                //             height: { ideal: 480 },
                                //             frameRate: { ideal: 15, max: 20 },

                                //         },
                                //         recv: false,
                                //         simulcast: true,
                                //     },
                                // ],
                                tracks: [
                                    ...(mediaStream.getAudioTracks().length > 0
                                        ? [{
                                            type: "audio",
                                            capture: mediaStream.getAudioTracks()[0],
                                            recv: false,
                                        }]
                                        : []),

                                    ...(mediaStream.getVideoTracks().length > 0
                                        ? [{
                                            type: "video",
                                            capture: mediaStream.getVideoTracks()[0],
                                            recv: false,
                                            simulcast: true,
                                        }]
                                        : []),
                                ],

                                success: (jsep: any) => {
                                    console.log("Created local offer:", jsep);
                                    publisherHandle.send({
                                        message: {
                                            request: "publish",
                                            audio: true,
                                            video: true,
                                            bitrate: 512000, // 512 kbps
                                            videocodec: "vp8",
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
            for (const subscriber of subscriberRefs.current.values()) {
                try {
                    subscriber.send({
                        message: {
                            request: "leave",
                        },
                    });

                    subscriber.hangup();

                    subscriber.detach({
                        success: () => {
                            console.log("Subscriber detached");
                        },
                        error: (err: any) => {
                            console.error(
                                "Subscriber detach error:",
                                err
                            );
                        },
                    });
                } catch (error) {
                    console.error(error);
                }
            }

            subscriberRefs.current.clear();

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
    // Initialization and Janus setup
    useEffect(() => {
        window.adapter = adapter;

        notificationAudioRef.current =
            new Audio("/sounds/soundreality-notification-center-443093.mp3");

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
    // Listen for local stream changes to update video element
    useEffect(() => {
        if (!localVideoRef.current || !localStream) return;

        if (!isCameraOff) {
            localVideoRef.current.srcObject = localStream;
        } else {
            localVideoRef.current.srcObject = null; // FORCE CLEAR
        }
    }, [localStream, isCameraOff]);

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);
    // Handle layout changes based on visible streams and dominant speaker
    useEffect(() => {
        subscriberRefs.current.forEach(
            (subscriber, publisherId) => {

                const publisherIdStr =
                    publisherId.toString();

                const isVisible =
                    visibleStreamIds.includes(
                        publisherIdStr
                    );

                const isDominant =
                    prioritySpeakerId === publisherIdStr;

                /**
                 * Layer selection strategy
                 */

                let substream = 2;

                // dominant speaker
                if (isDominant) {
                    substream = 0;
                }

                // visible grid users
                else if (isVisible) {
                    substream = 0;
                }

                // hidden users
                else {
                    substream = 2;
                }

                subscriber.send({
                    message: {
                        request: "configure",

                        audio: true,

                        video: true,

                        substream,

                        /**
                         * force fresh keyframe
                         */
                        keyframe: true,
                    },
                });
            }
        );

    }, [
        visibleStreamIds,
        prioritySpeakerId,
    ]);

    // socket listners
    useEffect(() => {

        if (!socket || !isConnected) return;
        // Listen for raise hand events
        socket.on(SOCKET_EVENTS.RAISE_HAND, (data) => {
            const id = String(data.publisherId)

            setRaisedHandsSet(prev => {
                const newSet = new Set(prev);

                if (data.raised) {
                    newSet.add(id);
                } else {
                    newSet.delete(id);
                }

                return newSet;
            });
        });
        // Listen for reactions
        socket.on(SOCKET_EVENTS.REACTION, (data) => {
            const id = `${Date.now()}-${Math.random()}`;

            const reactionItem = {
                id,
                emoji: data.reaction,
                left: Math.random() * 80 + 10,
                userName: data?.username,
                userId: data?.userId,
            };

            setReactions((prev) => [...prev, reactionItem]);

            setTimeout(() => {
                setReactions((prev) =>
                    prev.filter((r) => r.id !== id)
                );
            }, 2000);
        });
        //listen for camera toggle
        socket.on(SOCKET_EVENTS.CAMERA_TOGGLE, (data) => {
            setRemoteStreams((prev) =>
                prev.map((user) =>
                    user.id === data.publisherId.toString()
                        ? { ...user, isCameraOff: data.isCameraOff }
                        : user
                )
            );
        });
        socket.on(SOCKET_EVENTS.CHAT, (message) => {
            setMessages((prev) => [...prev, message]);
            if (!isChatOpenRef.current) {
                setUnreadCount((prev) => prev + 1);

                const audio = notificationAudioRef.current;

                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;

                    audio.play().catch(() => {
                        console.warn("Failed to play notification sound");
                    });
                }
            }
        });

        return () => {
            socket.off(SOCKET_EVENTS.RAISE_HAND);
            socket.off(SOCKET_EVENTS.REACTION);
            socket.off(SOCKET_EVENTS.CAMERA_TOGGLE);
            socket.off(SOCKET_EVENTS.CHAT);
        };
    }, [socket, isConnected]);

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

    const toggleRaiseHand = () => {
        const myPublisherId = publisherIdRef.current;
        if (!myPublisherId) return;

        const idStr = myPublisherId.toString();
        const isRaised = raisedHandsSet.has(idStr);

        // instant UI update
        setRaisedHandsSet(prev => {
            const newSet = new Set(prev);
            if (isRaised) newSet.delete(idStr);
            else newSet.add(idStr);
            return newSet;
        });

        emitRaiseHand({
            roomId,
            userId: userId || socket?.id || '',
            username,
            raised: !isRaised,
        });
    };

    const startScreenShare = async () => {
        try {
            // 🚨 BLOCK if someone else is sharing
            if (sharedScreen && !isScreenSharing) {
                alert("Someone is already presenting");
                return;
            }

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
                                    simulcast: true,
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

    const sendReaction = (emoji: string) => {
        const id = `${Date.now()}-${Math.random()}`;

        const reactionItem = {
            id,
            emoji,
            left: Math.random() * 80 + 10,
        };

        setReactions((prev) => [...prev, reactionItem]);

        setTimeout(() => {
            setReactions((prev) =>
                prev.filter((r) => r.id !== id)
            );
        }, 2000);

        socket?.emit(SOCKET_EVENTS.REACTION, {
            roomId,
            reaction: emoji,
            userName: username,
            userId: userId || socket?.id,
        });
    };

    const toggleMic = () => {
        if (!publisherRef.current || !localStream) return;

        const newMutedState = !isMuted;

        // Local UI
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !newMutedState;
        });

        // Janus control
        publisherRef.current.send({
            message: {
                request: "configure",
                audio: !newMutedState,
            },
        });

        setIsMuted(newMutedState);
    };

    const toggleCamera = () => {
        if (!publisherRef.current || !localStream) return;

        const newState = !isCameraOff;

        // Control actual track (IMPORTANT)
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !newState;
        });

        // Tell Janus
        publisherRef.current.send({
            message: {
                request: "configure",
                video: !newState,
            },
        });

        // Update UI
        setIsCameraOff(newState);

        // Notify others (VERY IMPORTANT)
        socket?.emit(SOCKET_EVENTS.CAMERA_TOGGLE, {
            roomId,
            userId: userId || socket?.id,
            isCameraOff: newState,
        });
    };

    const sendMessage = (message: string) => {
        if (!message.trim()) return;

        socket?.emit(
            SOCKET_EVENTS.CHAT,
            {
                roomId,
                message,
            }
        );
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
            raiseHand={toggleRaiseHand}
            raisedHandsSet={raisedHandsSet}
            myPublisherId={publisherIdRef.current}
            handleReaction={sendReaction}
            reactions={reactions}
            toggleCamera={toggleCamera}
            toggleMic={toggleMic}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            messages={messages}
            sendMessage={sendMessage}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            unreadCount={unreadCount}
            setUnreadCount={setUnreadCount}
            onVisibleStreamsChange={(ids) => {
                setVisibleStreamIds(prev => {
                    if (
                        prev.length === ids.length &&
                        prev.every((id, i) => id === ids[i])
                    ) {
                        return prev;
                    }

                    return ids;
                });
            }}
            activeSpeakerId={activeSpeakerId}
            prioritySpeakerId={prioritySpeakerId}
        />
    );
}