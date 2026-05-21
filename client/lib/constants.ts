export const JANUS_HTTP_URL = "http://localhost:8088/janus";

export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

export const NEXT_HANDLER_URL = {
  API: "/api",
  CREATE_ROOM: "/create-room",
  SIGN_UP: "/api/user/register",
  LOGIN: "/api/user/login",
  GET_USERS: "/api/user/get-users",
  LOGOUT: "/api/user/logout",
  GET_CONVERSATION: "/api/chat/get-conversation",
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

  PRIVATE_MESSAGE: "private-message",
  PRIVATE_MESSAGE_RECEIVED: "private-message-received",
  GET_CONVERSATION_MESSAGES: "get-conversation-messages",
  CONVERSATION_MESSAGES: "conversation-messages",
  ONLINE_USERS: "online-users",

  SEND_CONNECTION_REQUEST: "send-connection-request",
  CONNECTION_REQUEST_RECEIVED: "connection-request-received",
  ACCEPT_CONNECTION_REQUEST: "accept-connection-request",
  REJECT_CONNECTION_REQUEST: "reject-connection-request",
  CONNECTION_ACCEPTED: "accept-connection-request",
  CONNECTION_REJECTED: "connection-rejected",
};

export const BACKEND_URLS = {
  AUTH: {
    LOGIN: `${SERVER_URL}/api/auth/login`,
    REGISTER: `${SERVER_URL}/api/auth/register`,
    USERS: `${SERVER_URL}/api/users/users`,
  },
  CHAT: {
    GET_CONVERSATION: (userId: string) =>
      `${SERVER_URL}/api/chat/conversation/${userId}`,
  },
  RECORDING: {
    SAVE: `${SERVER_URL}/api/recordings/save`,
    GET_RECORDS: `${SERVER_URL}/api/recordings/meeting-records`,
  },
};

export const LS_KEYS = {
  DEVICE_SETUP: "deviceSetup",
};
