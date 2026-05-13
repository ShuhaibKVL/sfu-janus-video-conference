import express from 'express';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model";

const router = express.Router();

/**
 * SIGNUP
 */

router.post('/register', async (req, res) => {
    try {

        const { name, email, password } = req.body;
        // Check if user already exists
        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        })

        const token = jwt.sign({
            userId: newUser._id
        },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "1d"
            }
        )

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        })
    } catch (error) {
        console.log('Signup error:', error);
        res.status(500).json({ message: "Signup failed" })
    }
})

/**
 * LOGIN
 */

router.post('/login', async (req, res) => {
    try {
        console.log("Login request body:", req.body);
        const { email, password } = req.body;
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign({
            userId: user._id
        },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "1d"
            }
        )

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })
    } catch (error) {
        console.error("login error :", error);

        res.status(500).json({
            message:
                "Login failed",
        });
    }
})

/** 
 * Get User Info
 */

router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select(['_id', 'name', 'email'])
        console.log("Fetched users:", users);

        res.status(200).json({
            success: true,
            count: users?.length,
            users
        });
    } catch (error: any) {
        console.log("Error fetching users:", error);
        res.status(500).json({ success: false, message: error?.message })
    }
})

export default router;