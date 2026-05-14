import express from "express";
import User from "../models/User.model";

const router = express.Router();

/** 
 * Get User Info
 */

router.get("/users", async (req: any, res) => {
    try {
        console.log('user get end point')
        const users = await User.find({
            _id: {
                $ne: req.user?.userId
            }
        }).select(["_id", "name", "email"]);

        res.status(200).json({
            success: true,
            users
        });

    } catch (error: any) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;