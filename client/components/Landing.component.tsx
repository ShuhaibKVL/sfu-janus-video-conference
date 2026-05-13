"use client";

import Link from "next/link";

export default function LandingPage() {

    return (

        <main className="
            min-h-screen
            bg-black
            flex
            flex-col
        ">

            {/* HEADER */}
            <header className="
                h-[80px]
                border-b
                border-white/10
                px-8
                flex
                items-center
                justify-between
            ">

                {/* LOGO */}
                <div className="flex items-center gap-3">

                    <div className="
                        w-10
                        h-10
                        rounded-full
                        bg-gradient-to-r
                        from-indigo-600
                        to-purple-700
                        flex
                        items-center
                        justify-center
                        text-white
                        font-bold
                    ">
                        J
                    </div>

                    <h1 className="
                        text-white
                        text-2xl
                        font-bold
                    ">
                        Janus SFU
                    </h1>

                </div>

                {/* ACTIONS */}
                {/* <div className="flex items-center gap-4">

                    <Link
                        href="/login"
                        className="
                            h-[44px]
                            px-5
                            rounded-xl
                            border
                            border-white/10
                            text-white
                            flex
                            items-center
                            justify-center
                            hover:bg-white/5
                            transition-all
                        "
                    >
                        Sign In
                    </Link>

                    <Link
                        href="/signup"
                        className="
                            h-[44px]
                            px-5
                            rounded-xl
                            bg-gradient-to-r
                            from-indigo-600
                            to-purple-700
                            text-white
                            font-semibold
                            flex
                            items-center
                            justify-center
                        "
                    >
                        Sign Up
                    </Link>

                </div> */}

            </header>

            {/* CENTER */}
            <section className="
                flex-1
                flex
                items-center
                justify-center
                px-4

            ">
                <div className="
                    w-full
                    max-w-3xl
                    rounded-4xl
                    border
                     border-white/10
                    bg-neutral-950
                    px-10
                    py-16
                    text-center
                ">

                    {/* TITLE */}
                    <h1 className="
                        text-6xl
                        font-bold
                        text-white
                        leading-tight
                        mb-6
                    ">
                        Modern Realtime
                        <br />
                        Video Meetings
                    </h1>

                    {/* SUBTITLE */}
                    <p className="
                        text-neutral-400
                        text-lg
                        leading-relaxed
                        max-w-2xl
                        mx-auto
                        mb-12
                    ">
                        Seamless low-latency conferencing powered
                        by scalable Janus SFU architecture.
                    </p>

                    {/* BUTTONS */}
                    <div className="
                        flex
                        items-center
                        justify-center
                        gap-4
                    ">

                        <Link
                            href="/signup"
                            className="
                                h-[56px]
                                px-8
                                rounded-2xl
                                bg-gradient-to-r
                                from-indigo-600
                                to-purple-700
                                text-white
                                font-semibold
                                flex
                                items-center
                                justify-center
                            "
                        >
                            Join With Us
                        </Link>

                        <Link
                            href="/login"
                            className="
                                h-[56px]
                                px-8
                                rounded-2xl
                                border
                                border-white/10
                                text-white
                                font-semibold
                                flex
                                items-center
                                justify-center
                                hover:bg-white/5
                                transition-all
                            "
                        >
                            Sign In
                        </Link>

                    </div>

                </div>

            </section>

        </main>
    );
}