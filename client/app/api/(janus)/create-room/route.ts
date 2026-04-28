import { NextResponse } from "next/server";

function generateTransaction() {
    return Math.random().toString(36).substring(2, 15);
}

export async function POST() {
    try {
        const JANUS_HTTP_URL =
            "http://localhost:8088/janus";

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
          Generate Dynamic Room ID
        */

        const roomId = Math.floor(
            1000 + Math.random() * 9000
        );

        /*
          STEP 4
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
                        room: roomId,
                        permanent: false,
                        publishers: 20,
                        description: `Room ${roomId}`,
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
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}