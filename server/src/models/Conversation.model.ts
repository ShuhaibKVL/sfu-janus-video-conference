import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastReadMessage: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation