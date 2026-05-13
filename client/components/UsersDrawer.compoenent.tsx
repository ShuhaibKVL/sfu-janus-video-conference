"use client";

import { NEXT_HANDLER_URL } from "@/lib/constants";
import { IUser } from "@/types/chat.types";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function OnlineUsersDrawer({
    open,
    onClose
}: {
    open: boolean;
    onClose: () => void;
}) {

    const [users, setUsers] = useState<IUser[] | null>(null)

    const fetchUsers = async () => {
        try {
            const res = await fetch(NEXT_HANDLER_URL.GET_USERS, {
                method: "GET"
            })

            const usersList = await res.json();
            console.log('users :', usersList)

            if (res?.ok && usersList?.users) {
                setUsers(usersList?.users)
            }
        } catch (error: any) {
            console.log('error on fetching users :', error.message)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    if (!open) {
        return null;
    }

    return (

        <div className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-sm
        ">

            {/* BACKDROP */}
            <div
                onClick={onClose}
                className="absolute inset-0"
            />

            {/* DRAWER */}
            <div className="
                relative
                w-[70vw]
                max-w-5xl
                h-[75vh]
                rounded-[32px]
                border
                border-white/10
                bg-neutral-950
                overflow-hidden
                flex
                flex-col
            ">

                {/* HEADER */}
                <div className="
                    h-[80px]
                    border-b
                    border-white/10
                    px-8
                    flex
                    items-center
                    justify-between
                    shrink-0
                ">

                    <div>

                        <h2 className="
                            text-2xl
                            font-bold
                            text-white
                        ">
                            Online Users
                        </h2>

                        <p className="
                            text-sm
                            text-neutral-400
                            mt-1
                        ">
                            Currently active users
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="
                            w-11
                            h-11
                            rounded-xl
                            border
                            border-white/10
                            text-white
                            hover:bg-white/5
                            transition-all
                        "
                    >
                        ✕
                    </button>

                </div>

                {/* TABLE */}
                <div className="
                    flex-1
                    overflow-y-auto
                    p-6
                ">

                    <div className="
                        rounded-3xl
                        border
                        border-white/10
                        overflow-hidden
                    ">

                        {
                            users && users?.length > 0 ?
                                users.map((user) => (

                                    <div
                                        key={user._id}
                                        className="
                                        h-[82px]
                                        px-6
                                        border-b
                                        border-white/10
                                        flex
                                        items-center
                                        justify-between
                                        hover:bg-white/[0.02]
                                        transition-all
                                    "
                                    >

                                        {/* LEFT */}
                                        <div className="
                                        flex
                                        items-center
                                        gap-4
                                    ">

                                            <div className="rounded-full border border-gray-400 h-7 w-7 flex items-center justify-center text-sm font-medium">
                                                {user?.name ? user.name[0] : "--"}
                                            </div>

                                            <div>

                                                <h3 className="
                                                text-white
                                                font-semibold
                                                text-lg
                                            ">
                                                    {user.name}
                                                </h3>

                                                <p className="
                                                text-sm
                                                text-gray-400
                                            ">
                                                    {user?.email}
                                                </p>

                                            </div>

                                        </div>

                                        {/* RIGHT */}
                                        <button
                                            className="
                                            h-[46px]
                                            px-6
                                            rounded-2xl
                                            bg-gradient-to-r
                                            from-indigo-600
                                            to-purple-700
                                            text-white
                                            font-semibold
                                            hover:scale-[1.02]
                                            transition-all
                                        "
                                        >
                                            Connect
                                        </button>

                                    </div>
                                )) : <h1>Not have users on online right now</h1>
                        }

                    </div>

                </div>

            </div>

        </div>
    );
}