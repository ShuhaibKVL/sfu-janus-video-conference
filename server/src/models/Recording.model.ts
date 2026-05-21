import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  roomId: {
    type: String,
    required: true,
  },

  filename: {
    type: String,
    required: true,
  },

  filepath: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["audio", "video", "screen"],
    default: "video",
  },

  size: Number,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Recording", recordingSchema);
