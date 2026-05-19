// Room meeting chat
export interface IChatMessage {
  id: string;
  sender: string;
  senderId: number;
  message: string;
  timestamp: number;
}

export interface IUser {
  name: string;
  _id: string;
  email: string;
  connection?: IConnection | null;
}

// Private chat
export interface IPrivateMessage {
  _id?: string;
  conversationId?: string;
  senderId: string;
  text: string;
  seen?: string;
  createdAt?: string;
}

export interface IConnection {
  _id: string;
  requesterId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  note?: string;
}
