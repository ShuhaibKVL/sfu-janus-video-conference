import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    seen: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },]
}, { timestamps: true })

const Message = mongoose.model('Messages', messageSchema)

export default Message