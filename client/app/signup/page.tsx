"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEXT_HANDLER_URL } from "@/lib/constants";
import { EMAIL_REGEX, PASSWORD_REGEX } from "@/lib/utils";

export default function SignupPage() {

    const router = useRouter();

    const [name, setName] = useState("");

    const [email, setEmail] =
        useState("");
    const [password, setPassword] =
        useState("");
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [apiError, setApiError] = useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    const handleSignup = async () => {

        const newErrors = {
            name: "",
            email: "",
            password: "",
        };

        /**
         * Name validation
         */
        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        /**
         * Email validation
         */
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(email)) {
            newErrors.email = "Enter valid email";
        }

        /**
         * Password validation
         */
        if (!password.trim()) {
            newErrors.password = "Password is required";
        } else if (!PASSWORD_REGEX.test(password)) {
            newErrors.password =
                "Minimum 8 chars with uppercase, lowercase, number and special character";
        }

        /**
         * Stop if validation failed
         */
        if (
            newErrors.name ||
            newErrors.email ||
            newErrors.password
        ) {
            setErrors(newErrors);
            return;
        }

        /**
         * Clear errors
         */
        setErrors({
            name: "",
            email: "",
            password: "",
        });

        setTimeout(() => {
            setErrors({
                name: "",
                email: "",
                password: "",
            });
        }, 5000);

        try {

            setLoading(true);

            const res = await fetch(
                NEXT_HANDLER_URL.SIGN_UP,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            const data = await res.json();

            console.log("Signup response:", data);

            if (!res.ok) {
                setApiError(data.error || "Signup failed");
                setTimeout(() => setApiError(null), 3000);
                return;
            }

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            router.push("/");

        } catch (error) {
            console.error("Signup error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex items-center justify-center px-4">

            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-neutral-950 p-8">
                {/* Error block */}
                <div className="h-6">
                    {apiError && (
                        <div className="text-red-500 text-center mt-4">
                            {apiError}
                        </div>
                    )}
                </div>
                <h1 className="text-4xl font-bold text-white mb-8 text-center">
                    Create Account
                </h1>

                <div className="mb-4">

                    <input
                        placeholder="Name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);

                            setErrors((prev) => ({
                                ...prev,
                                name: "",
                            }));
                        }}
                        className={`
            w-full h-[56px]
            rounded-2xl
            bg-neutral-900
            border
            px-5
            text-white
            outline-none
            transition-all
            ${errors.name
                                ? "border-red-500"
                                : "border-white/10"}
        `}
                    />

                    {errors.name && (
                        <p className="text-red-500 text-sm mt-2 ml-1">
                            {errors.name}
                        </p>
                    )}

                </div>

                <div className="mb-4">

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => {

                            setEmail(e.target.value);

                            setErrors((prev) => ({
                                ...prev,
                                email: "",
                            }));
                        }}
                        className={`
            w-full h-[56px]
            rounded-2xl
            bg-neutral-900
            border
            px-5
            text-white
            outline-none
            transition-all
            ${errors.email
                                ? "border-red-500"
                                : "border-white/10"}
        `}
                    />

                    {errors.email && (
                        <p className="text-red-500 text-sm mt-2 ml-1">
                            {errors.email}
                        </p>
                    )}

                </div>

                <div className="mb-6">

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {

                            setPassword(e.target.value);

                            setErrors((prev) => ({
                                ...prev,
                                password: "",
                            }));
                        }}
                        className={`
            w-full h-[56px]
            rounded-2xl
            bg-neutral-900
            border
            px-5
            text-white
            outline-none
            transition-all
            ${errors.password
                                ? "border-red-500"
                                : "border-white/10"}
        `}
                    />

                    {errors.password && (
                        <p className="text-red-500 text-sm mt-2 ml-1">
                            {errors.password}
                        </p>
                    )}

                </div>

                <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full h-[56px] rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold"
                >
                    {loading
                        ? "Creating..."
                        : "Create Account"}
                </button>

            </div>
        </main>
    );
}