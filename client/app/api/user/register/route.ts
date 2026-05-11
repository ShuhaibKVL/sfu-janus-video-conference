import { BACKEND_URLS } from "@/lib/constants";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { REGISTER } = BACKEND_URLS.AUTH;
        const body = await request.json();
        console.log("Registration request body:", body);

        const res = await fetch(REGISTER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        console.log("Registration response:", res);

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ success: false, error: data.message || "Registration failed" }, { status: res.status });
        }

        const response = NextResponse.json({
            success: true,
            token: data.token,
            user: data.user
        });

        response.cookies.set('token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 days
        })

        return response;
    } catch (error) {
        console.log("Registration error:", error);
        return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
    }
}