import express from "express";
import User from "../models/User.model";
import mongoose from "mongoose";

const router = express.Router();

/**
 * Get User Info
 */

router.get("/users", async (req: any, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user?.userId);

    const users = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: currentUserId,
          },
        },
      },

      {
        $lookup: {
          from: "connections",

          let: {
            targetUserId: "$_id",
          },

          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        {
                          $eq: ["$requesterId", currentUserId],
                        },
                        {
                          $eq: ["$receiverId", "$$targetUserId"],
                        },
                      ],
                    },

                    {
                      $and: [
                        {
                          $eq: ["$receiverId", currentUserId],
                        },
                        {
                          $eq: ["$requesterId", "$$targetUserId"],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],

          as: "connection",
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,

          connection: {
            $arrayElemAt: ["$connection", 0],
          },
        },
      },
    ]);

    console.log("users :", users);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
