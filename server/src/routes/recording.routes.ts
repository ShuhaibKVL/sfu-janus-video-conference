import express from "express";
import RecordingModel from "../models/Recording.model";
import { convertRecording } from "../utils/convertRecordings";

const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    console.log("========== SAVE RECORDING ==========");

    const user = (req as any)?.user;

    const { recordingName, roomId, type } = req.body;

    if (!recordingName) {
      return res.status(400).json({
        error: "recordingName is required",
      });
    }

    console.log("Recording Name:", recordingName);

    /**
     * CONVERT RECORDING
     */
    const convertedPath = await convertRecording(recordingName);

    console.log("Converted Path:", convertedPath);

    /**
     * SAVE ONLY AFTER SUCCESSFUL CONVERSION
     */
    const recording = await RecordingModel.create({
      userId: user.userId,

      roomId,

      filename: `${recordingName}.mp4`,

      filepath: `/converted/${recordingName}.mp4`,

      type,
    });

    console.log("===== RECORD SAVED TO DB =====");

    res.status(201).json(recording);
  } catch (error: any) {
    console.log("===== SAVE RECORDING ERROR =====");
    console.log(error);

    res.status(500).json({
      error: "Failed to save recording",
      details: error?.message || "Unknown error",
    });
  }
});

router.get("/meeting-records", async (req, res) => {
  try {
    const user = (req as any).user;

    const recordings = await RecordingModel.find({
      userId: user.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(recordings);
  } catch (error) {
    console.log("error fetching recordings :", error);

    res.status(500).json({
      error: "Failed to fetch recordings",
    });
  }
});

export default router;
