import { BACKEND_URLS } from "@/lib/constants";
import { getToken } from "@/lib/getToken";

export async function GET() {
  try {
    /*
        GET COOKIE FROM NEXT REQUEST
        */
    const token = await getToken();

    if (!token) {
      throw new Error("Token not found");
    }

    /*
        FORWARD COOKIE TO BACKEND
        */
    const users = await fetch(`${BACKEND_URLS.AUTH.USERS}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token?.value}`,
      },
    });

    const data = await users.json();
    console.log("Users data:", data);
    if (!users.ok) {
      throw new Error("Failed to fetch users");
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch users" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
