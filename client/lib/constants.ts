export const JANUS_HTTP_URL =
    "http://localhost:8088/janus";

export const SERVER_URL =
    process.env.NEXT_PUBLIC_SERVER_URL

export const NEXT_HANDLER_URL = {
    API: "/api",
    CREATE_ROOM: "/create-room",
    SIGN_UP: "/api/user/register",
    LOGIN: "/api/user/login",
    GET_USERS: "/api/user/get-users",
    LOGOUT: "/api/users/logout"
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

export const BACKEND_URLS = {
    AUTH: {
        LOGIN: `${SERVER_URL}/api/auth/login`,
        REGISTER: `${SERVER_URL}/api/auth/register`,
        USERS: `${SERVER_URL}/api/auth/users`,
    },
}

export const LS_KEYS = {
    DEVICE_SETUP: "deviceSetup"
}