import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.token;
        console.log('toke on auth middleware :', token)
        if (!token) {
            return res.status(401).json({
                message: "Invalid token"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        );

        req.user = decoded;

        next();

    } catch (error) {
        console.log("AUTH MIDDLEWARE ERROR:", error);

        return res.status(401).json({
            message: "Unauthorized"
        });
    }
};