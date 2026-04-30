import { JANUS_HTTP_URL } from "@/lib/constants";
import { generateTransaction } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        /*
          STEP 1
          Create Janus Session
        */
       

        const createSessionRes = await fetch(
            JANUS_HTTP_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    janus: "create",
                    transaction: generateTransaction(),
                }),
            }
        );

        const sessionData =
            await createSessionRes.json();

        const sessionId =
            sessionData?.data?.id;

        if (!sessionId) {
            throw new Error(
                "Failed to create Janus session"
            );
        }

        /*
          STEP 2
          Attach VideoRoom Plugin
        */

        const attachPluginRes = await fetch(
            `${JANUS_HTTP_URL}/${sessionId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    janus: "attach",
                    plugin: "janus.plugin.videoroom",
                    transaction: generateTransaction(),
                }),
            }
        );

        const pluginData =
            await attachPluginRes.json();

        const handleId =
            pluginData?.data?.id;

        if (!handleId) {
            throw new Error(
                "Failed to attach VideoRoom plugin"
            );
        }

        /*
          STEP 3
          Create Room inside Janus
        */

        const createRoomRes = await fetch(
            `${JANUS_HTTP_URL}/${sessionId}/${handleId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    janus: "message",
                    transaction: generateTransaction(),
                    body: {
                        request: "create",
                        permanent: false,
                        publishers: 20,
                        description: `Dynamic Room`,
                    },
                }),
            }
        );

        const roomData =
            await createRoomRes.json();

        console.log(
            "Create Room Response:",
            roomData
        );

        const roomId =
            roomData?.plugindata?.data?.room;

        if (!roomId) {
            throw new Error(
                "Failed to get created room ID"
            );
        }

        // STEP 4 - Destroy session (IMPORTANT)

        await fetch(`${JANUS_HTTP_URL}/${sessionId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                janus: "destroy",
                transaction: generateTransaction(),
            }),
        });

        /*
          STEP 5
          Return room ID
        */

        return NextResponse.json({
            success: true,
            roomId,
        });
    } catch (error: any) {
        console.error(
            "Create Room API Error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: error?.message,
            },
            {
                status: 500,
            }
        );
    }
}