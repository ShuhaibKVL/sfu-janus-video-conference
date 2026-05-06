type Base = {
    roomId: number;
    userId: string;     // stable id (socket.id or your own)
    username: string;
    ts: number;
};

export type RaiseHand = Base & {};
export type Reaction = Base & { emoji: string };
export type MuteToggle = Base & { audioMuted?: boolean; videoMuted?: boolean };
export type Chat = Base & { message: string };

export interface IReaction { id: string; emoji: string; left: number, userName?: string, userId?: string }