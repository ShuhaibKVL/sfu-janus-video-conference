"use client";

import { NEXT_HANDLER_URL } from "@/lib/constants";
import { IPrivateMessage, IUser } from "@/types/chat.types";
import { useEffect, useRef, useState } from "react";
import { useGlobalSocket } from "@/app/context/socket.context";
import { SOCKET_EVENTS } from "@/lib/constants";

export default function OnlineUsersDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const socket = useGlobalSocket();
  const [users, setUsers] = useState<IUser[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const [messages, setMessages] = useState<IPrivateMessage[]>([]);

  const [messageText, setMessageText] = useState("");

  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const isUserNearBottomRef = useRef(true);

  const fetchUsers = async () => {
    try {
      console.log("fetch users");
      const res = await fetch(NEXT_HANDLER_URL.GET_USERS, {
        method: "GET",
      });

      const usersList = await res.json();
      console.log("users response :", usersList);

      if (res?.ok && usersList?.users) {
        setUsers(usersList?.users);
      }
    } catch (error: any) {
      console.log("error on fetching users :", error.message);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Sockert listners
  useEffect(() => {
    console.log("socket :", socket);
    if (!socket) return;

    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE_RECEIVED, (message) => {
      console.log("message recived :", message);
      setMessages((prev) => [...prev, message]);

      // if already near bottom
      // auto scroll
      if (isUserNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom("auto");
        });
      } else {
        // user reading old messages
        setShowNewMessageButton(true);
      }
    });

    socket.on(SOCKET_EVENTS.ONLINE_USERS, (users) => {
      console.log("online users listner :", users);
      setOnlineUserIds(users);
    });

    socket.on(SOCKET_EVENTS.CONNECTION_REQUEST_RECEIVED, (connection) => {
      console.log("connection requst recieved :", connection);
      setUsers(
        (prev) =>
          prev?.map((user) => {
            if (user._id !== connection.requesterId) {
              return user;
            }

            return {
              ...user,
              connection,
            };
          }) || [],
      );
    });

    socket.on(SOCKET_EVENTS.CONNECTION_ACCEPTED, (updatedConnection) => {
      console.log("connection request accepted :", updatedConnection);
      setUsers(
        (prev) =>
          prev?.map((user) => {
            if (
              user._id !== updatedConnection.requesterId &&
              user._id !== updatedConnection.receiverId
            ) {
              return user;
            }

            return {
              ...user,
              connection: updatedConnection,
            };
          }) || [],
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.PRIVATE_MESSAGE_RECEIVED);
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
    };
  }, [socket]);

  // Load messages when user selects a conversation
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `${NEXT_HANDLER_URL.GET_CONVERSATION}?userId=${selectedUser._id}`,
          { method: "GET" },
        );

        if (res.ok) {
          const data = await res.json();
          setMessages(data.data || []);

          // scroll only when opening conversation
          requestAnimationFrame(() => {
            scrollToBottom("auto");
          });
        } else {
          console.error("Failed to load messages");
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedUser]);

  // Detect user scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const handleScroll = () => {
      const threshold = 60;

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      const isNearBottom = distanceFromBottom < threshold;

      isUserNearBottomRef.current = isNearBottom;

      if (isNearBottom) {
        setShowNewMessageButton(false);
      }
    };

    // IMPORTANT
    handleScroll();

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  // Send message
  const sendMessage = () => {
    if (!socket || !selectedUser || !messageText?.trim()) return;

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const payload = {
      receiverId: selectedUser?._id,
      text: messageText,
    };

    socket.emit(SOCKET_EVENTS.PRIVATE_MESSAGE, payload);

    setMessages((prev) => [
      ...prev,
      {
        senderId: currentUser.id,
        text: messageText,
        createdAt: new Date().toISOString(),
      },
    ]);

    setMessageText("");

    requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });
  };

  // Send connection request
  const sendConnecrtion = (targetUserId: string, note?: string) => {
    console.log("send connection request");
    if (!socket) return;
    socket?.emit(SOCKET_EVENTS.SEND_CONNECTION_REQUEST, { targetUserId, note });
  };

  const acceptRequest = (connectionId: string) => {
    socket?.emit(SOCKET_EVENTS.ACCEPT_CONNECTION_REQUEST, { connectionId });
  };

  const rejectRequest = (connectionId: string) => {
    socket?.emit(SOCKET_EVENTS.REGISTER_USER, { connectionId });
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm
        "
    >
      {/* BACKDROP */}
      <div onClick={onClose} className="absolute inset-0" />

      {/* DRAWER */}
      <div
        className="
                relative
                w-[70vw]
                max-w-5xl
                h-[75vh]
                rounded-[32px]
                border
                border-white/10
                bg-neutral-950
                overflow-hidden
                flex
                flex-col
            "
      >
        {/* HEADER */}
        <div
          className="
                    h-[80px]
                    border-b
                    border-white/10
                    px-8
                    flex
                    items-center
                    justify-between
                    shrink-0
                "
        >
          <div>
            <h2
              className="
                            text-2xl
                            font-bold
                            text-white
                        "
            >
              Registerd Users
            </h2>

            <p
              className="
                            text-sm
                            text-neutral-400
                            mt-1
                        "
            >
              Currently active users
            </p>
          </div>

          <button
            onClick={onClose}
            className="
                            w-11
                            h-11
                            rounded-xl
                            border
                            border-white/10
                            text-white
                            hover:bg-white/5
                            transition-all
                        "
          >
            ✕
          </button>
        </div>

        {/* TABLE */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div
            className="
        w-[320px]
        border-r
        border-white/10
        overflow-y-auto
    "
          >
            {users?.map((user) => {
              const isOnline = onlineUserIds.includes(user._id);
              const isConnection = user?.connection;
              console.log("user :", user);
              const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}",
              );
              return (
                <div
                  key={user._id}
                  onClick={() => {
                    if (isConnection?.status === "accepted") {
                      setSelectedUser(user);
                    }
                  }}
                  className={`
    px-5
    py-4
    border-b
    border-white/5
    transition-all
    cursor-pointer

    ${selectedUser?._id === user._id ? "bg-white/10" : "hover:bg-white/[0.03]"}
  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* LEFT */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`
          w-11
          h-11
          rounded-full
          flex
          items-center
          justify-center
          text-white
          font-semibold
          shrink-0
          bg-neutral-800
          border

          ${isOnline ? "border-green-500" : "border-white/10"}
        `}
                      >
                        {user.name[0]}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {user.name}
                        </h3>

                        <p
                          className={`
            text-xs
            truncate

            ${isOnline ? "text-green-400" : "text-neutral-500"}
          `}
                        >
                          {isOnline ? "Online" : user.email}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* NO CONNECTION */}
                      {!isConnection && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sendConnecrtion(user._id);
                          }}
                          className="
            px-3
            py-1.5
            rounded-lg
            bg-indigo-600
            hover:bg-indigo-500
            text-white
            text-xs
            font-medium
            transition
          "
                        >
                          Connect
                        </button>
                      )}

                      {/* PENDING */}
                      {isConnection?.status === "pending" && (
                        <>
                          {/* CURRENT USER SENT REQUEST */}
                          {isConnection?.requesterId === currentUser.id ? (
                            <div
                              className="
                px-3
                py-1.5
                rounded-lg
                border
                border-yellow-500/20
                bg-yellow-500/10
                text-yellow-300
                text-xs
                font-medium
              "
                            >
                              Pending Request
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptRequest(user.connection?._id as string);
                                }}
                                className="
                  px-3
                  py-1.5
                  rounded-lg
                  bg-green-600
                  hover:bg-green-500
                  text-white
                  text-xs
                  font-medium
                  transition
                "
                              >
                                Accept
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectRequest(user.connection?._id as string);
                                }}
                                className="
                  px-3
                  py-1.5
                  rounded-lg
                  bg-neutral-800
                  hover:bg-neutral-700
                  border
                  border-white/10
                  text-white
                  text-xs
                  font-medium
                  transition
                "
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT CHAT AREA */}
          <div className="flex-1 flex flex-col">
            {!selectedUser ? (
              <div
                className="
                    flex-1
                    flex
                    items-center
                    justify-center
                    text-gray-500
                "
              >
                Select a user to start chatting
              </div>
            ) : (
              <>
                {/* HEADER */}
                <div
                  className="
                        h-[80px]
                        border-b
                        border-white/10
                        px-6
                        flex
                        items-center
                    "
                >
                  <div
                    className="
                            w-11
                            h-11
                            rounded-full
                            bg-indigo-600
                            flex
                            items-center
                            justify-center
                            text-white
                            font-bold
                        "
                  >
                    {selectedUser.name[0]}
                  </div>

                  <div className="ml-4">
                    <h2 className="text-white font-semibold">
                      {selectedUser.name}
                    </h2>

                    <p className="text-sm text-gray-400">Online</p>
                  </div>
                </div>

                {/* MESSAGES */}
                <div
                  ref={messagesContainerRef}
                  className="
                        flex-1
                        overflow-y-auto
                        p-6
                        space-y-4
                    "
                >
                  {messages && messages?.length > 0 ? (
                    messages?.map((msg, index) => {
                      console.log("msg :", msg);
                      const currentUser = JSON.parse(
                        localStorage.getItem("user") || "{}",
                      );
                      console.log("CURRENT USER :", currentUser);

                      const senderId = msg?.senderId;
                      const isMine = senderId === currentUser.id;
                      console.log(
                        "current user id:",
                        currentUser.id,
                        "sender id ",
                        senderId,
                        "is mine :",
                        isMine,
                      );

                      return (
                        <div
                          key={msg._id || index}
                          className={`
                                                                flex
                                                                 ${isMine ? "justify-end" : "justify-start"}
                                                                `}
                        >
                          <div
                            className={`
                                                                max-w-[70%]
                                                                px-4
                                                                py-3
                                                                rounded-2xl
                                                                text-sm

                                                                ${
                                                                  isMine
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "bg-neutral-800 text-white"
                                                                }
                                                        `}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-sm text-gray-500">
                      Start your chat
                    </p>
                  )}
                  {/* Detect the bottom of messge container to controll the auto scroll */}
                  <div ref={bottomRef} />
                </div>

                {showNewMessageButton && (
                  <div className=" absolute bottom-[110px] right-2.5 z-50">
                    <button
                      onClick={() => {
                        scrollToBottom();
                        setShowNewMessageButton(false);
                      }}
                      className="
                    px-4
                    py-2
                    rounded-full
                    border border-gray-300
                    bg-black
                    text-white
                    shadow-lg
                    text-sm
                "
                    >
                      New Messages ↓
                    </button>
                  </div>
                )}
                {/* INPUT */}
                <div
                  className="
                        h-[90px]
                        border-t
                        border-white/10
                        px-5
                        flex
                        items-center
                        gap-4
                    "
                >
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      console.log("on enter :", e.key);
                      if (e.key === "Enter") {
                        sendMessage();
                      }
                    }}
                    placeholder="Type message..."
                    className="
                                flex-1
                                h-[50px]
                                rounded-2xl
                                bg-neutral-900
                                border
                                border-white/10
                                px-5
                                text-white
                                outline-none
                            "
                  />

                  <button
                    onClick={sendMessage}
                    className="
                                h-[50px]
                                px-6
                                rounded-2xl
                                bg-indigo-600
                                text-white
                                font-semibold
                            "
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
