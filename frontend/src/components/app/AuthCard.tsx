"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { apiRequest, setStoredToken } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

type AuthCardProps = {
  mode: "login" | "signup" | "admin";
};

type AuthData = {
  token?: string;
  user?: unknown;
  admin?: unknown;
};

export function AuthCard({ mode }: AuthCardProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isAdmin = mode === "admin";
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const path = isAdmin ? "/api/admin/auth/login" : isSignup ? "/api/auth/signup" : "/api/auth/login";
      const response = await apiRequest<AuthData>(path, {
        method: "POST",
        mode: "public",
        body: JSON.stringify(isSignup ? payload : { email: payload.email, password: payload.password }),
      });

      if (response.data?.token) {
        setStoredToken(isAdmin ? "admin" : "user", response.data.token);
      }

      setMessage(response.message);

      if (isAdmin) {
        router.push("/admin/dashboard");
      } else if (isSignup) {
        const plan = new URLSearchParams(window.location.search).get("plan");
        router.push(plan ? `/onboarding?plan=${plan}` : "/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-blush px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-lg items-center">
        <Card className="w-full p-6 sm:p-9">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-fuchsiaBrand to-roseBrand text-white shadow-pink">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-black text-charcoal">What Should I Wear?</span>
          </Link>

          <h1 className="mt-8 text-4xl font-black tracking-normal text-charcoal">
            {isAdmin ? "Admin Login" : isSignup ? "Create Your Account" : "Welcome Back"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-charcoal/62">
            {isAdmin
              ? "Access the management console for users, subscriptions, moderation, settings, analytics, and content."
              : isSignup
                ? "Start free and connect your wardrobe, style profile, AI outfits, memory, and community."
                : "Sign in to continue styling, scanning, reviewing, saving, and managing your wardrobe."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isSignup ? (
              <label className="block">
                <span className="text-sm font-black text-charcoal">Full name</span>
                <input name="full_name" required className="mt-2 h-12 w-full rounded-2xl border border-black/10 px-4 text-sm outline-none focus:border-fuchsiaBrand" />
              </label>
            ) : null}
            <label className="block">
              <span className="text-sm font-black text-charcoal">Email</span>
              <input name="email" type="email" required className="mt-2 h-12 w-full rounded-2xl border border-black/10 px-4 text-sm outline-none focus:border-fuchsiaBrand" />
            </label>
            <label className="block">
              <span className="text-sm font-black text-charcoal">Password</span>
              <input name="password" type="password" required className="mt-2 h-12 w-full rounded-2xl border border-black/10 px-4 text-sm outline-none focus:border-fuchsiaBrand" />
            </label>
            <button type="submit" disabled={loading} className={buttonClasses({ className: "w-full" })}>
              {loading ? "Please wait..." : isAdmin ? "Login to admin" : isSignup ? "Create account" : "Login"}
            </button>
            {message ? <p className="text-sm font-bold text-charcoal/58">{message}</p> : null}
          </form>

          {!isAdmin ? (
            <p className="mt-6 text-center text-sm font-semibold text-charcoal/54">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <Link href={isSignup ? "/login" : "/signup"} className="text-fuchsiaBrand">
                {isSignup ? "Login" : "Get started"}
              </Link>
            </p>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
