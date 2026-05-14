// Room meeting chat
export interface IChatMessage {
    id: string;
    sender: string;
    senderId: number;
    message: string;
    timestamp: number;
}

export interface IUser { name: string, _id: string, email: string }

// Private chat 
export interface IPrivateMessage {
    _id?: string;
    conversationId?: string;
    senderId: string;
    text: string;
    seen?: string;
    createdAt?: string;
}