import { BACKEND_URLS } from "@/lib/constants";
import { getToken } from "@/lib/getToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        const token = await getToken()

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 }
            );
        }

        if (!token?.value) {
            return NextResponse.json(
                { success: false, message: "token not found" },
                { status: 400 }
            );
        }

        const response = await fetch(
            BACKEND_URLS.CHAT.GET_CONVERSATION(userId),
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    cookie: `token=${token?.value}`
                },
            }
        );

        const data = await response.json();
        console.log('response conversations :', data)

        return NextResponse.json(data, {
            status: response.status
        });

    } catch (error) {
        console.error("Error getting conversation:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get conversation" },
            { status: 500 }
        );
    }
}
