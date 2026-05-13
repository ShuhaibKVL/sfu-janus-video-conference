import { BACKEND_URLS } from "@/lib/constants";

export async function GET() {
    try {
        const users = await fetch(`${BACKEND_URLS.AUTH.USERS}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })

        console.log('Fetched users:', users);

        if (!users.ok) {
            throw new Error("Failed to fetch users");
        }
        const data = await users.json();
        console.log('Users data:', data);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch users" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
};