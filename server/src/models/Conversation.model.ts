import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Messages',
        required: false
    }
}, { timestamps: true })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation