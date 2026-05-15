"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEXT_HANDLER_URL } from "@/lib/constants";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await fetch(NEXT_HANDLER_URL.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        setError(data?.error || "Login failed");
        setTimeout(() => setError(null), 3000);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/meet");
    } catch (error) {
      console.error(error);

      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-neutral-950 p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Welcome Back
        </h1>
        {/* Error block */}
        <div className="h-6">
          {error && (
            <div className="text-red-500 text-center mt-4">{error}</div>
          )}
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[56px] rounded-2xl bg-neutral-900 border border-white/10 px-5 text-white mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-[56px] rounded-2xl bg-neutral-900 border border-white/10 px-5 text-white mb-6"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-[56px] rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
        <Link
          href="/signup"
          className="
                                h-[56px]
                                px-8
                                rounded-2xl
                                text-white
                                flex
                                items-center
                                justify-center
                                text-sm
                                font-serif
                            "
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
