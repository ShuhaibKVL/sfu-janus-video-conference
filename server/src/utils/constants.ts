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
};
