import { BACKEND_URLS, NEXT_HANDLER_URL } from "@/lib/constants";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { LOGIN } = BACKEND_URLS.AUTH;

    const body = await request.json();
    console.log("Login request body:", body);
    const res = await fetch(LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("Login response data:", data);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Login failed" },
        { status: res.status },
      );
    }

    const response = NextResponse.json({
      success: true,
      token: data.token,
      user: data.user,
    });

    response.cookies.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 },
    );
  }
}
