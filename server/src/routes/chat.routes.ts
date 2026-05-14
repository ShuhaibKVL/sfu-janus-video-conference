import express from 'express';
import Conversation from "../models/Conversation.model";
import Message from '../models/Message.model';

const router = express.Router();

/**
 * Get all conversations for the logged-in user
 * Shows: All chats with participants and last message preview
 */
router.get('/my-conversations', async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find all conversations where this user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'name email')
        .populate({
            path: 'lastMessage',
            select: 'text senderId createdAt'
        })
        .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            data: conversations
        });

    } catch (error: any) {
        console.log('Error getting conversations:', error);
        res.status(500).json({ 
            success: false, 
            message: error?.message 
        });
    }
});

/**
 * Get conversation and messages by userId
 * Finds or creates conversation between two users, returns messages
 */
router.get('/conversation/:userId', async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId;

        // Find conversation between these two users
        const conversation = await Conversation.findOne({
            participants: {
                $all: [currentUserId, otherUserId]
            }
        });

        if (!conversation) {
            return res.status(200).json({
                success: true,
                data: { messages: [] }
            });
        }

        // Get all messages in this conversation
        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error: any) {
        console.log('Error getting conversation:', error);
        res.status(500).json({ 
            success: false, 
            message: error?.message 
        });
    }
});

/**
 * Get all messages in a specific conversation
 */
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;

        const messages = await Message.find({
            conversationId
        })
        .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            data: messages
        });

    } catch (error: any) {
        console.log('Error getting messages:', error);
        res.status(500).json({ 
            success: false, 
            message: error?.message 
        });
    }
});

export default router;