export const JANUS_HTTP_URL =
    "http://localhost:8088/janus";

export const NEXT_HANDLER_URL = {
    API: "/api",
    CREATE_ROOM: "/create-room",
};

export const MAX_VISIBLE_STREAMS = 6;

// socket-events.ts
export const SOCKET_EVENTS = {
    REGISTER_USER: "register-user",
    JOIN: "join-room",
    LEAVE: "leave-room",

    RAISE_HAND: "raise-hand",
    REACTION: "reaction",
    MUTE_TOGGLE: "mute-toggle",
    CHAT: "chat-message",

    USER_LIST: "user-list",
    CAMERA_TOGGLE: "camera-toggle", 
};