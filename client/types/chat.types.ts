export interface IChatMessage {
    id: string;
    sender: string;
    senderId: number;
    message: string;
    timestamp: number;
}

export interface IUser { name: string, _id: string, email: string }