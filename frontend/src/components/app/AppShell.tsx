"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { userModules } from "@/data/backendRoutes";
import { apiRequest, clearStoredToken } from "@/lib/api";
import { cn } from "@/lib/utils";

type UserData = {
  user?: {
    full_name?: string;
    email?: string;
  };
};

function AppNavigation({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="App navigation">
      {userModules.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition",
              active ? "bg-fuchsiaBrand text-white shadow-pink" : "text-charcoal/62 hover:bg-charcoal/[0.04]",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [userLabel, setUserLabel] = useState("Stylist account");
  const router = useRouter();

  useEffect(() => {
    apiRequest<UserData>("/api/auth/me")
      .then((response) => {
        const user = response.data?.user;
        setUserLabel(user?.full_name || user?.email || "Stylist account");
      })
      .catch(() => setUserLabel("Sign in required"));
  }, []);

  function logout() {
    clearStoredToken("user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-blush">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-black/[0.06] bg-white/90 p-5 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-fuchsiaBrand to-roseBrand text-white shadow-pink">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-black text-charcoal">What Should I Wear?</span>
        </Link>
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
          <AppNavigation />
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/84 backdrop-blur-xl lg:ml-72">
        <div className="flex min-h-[72px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-black/10 bg-white text-charcoal lg:hidden"
            aria-label="Open app menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsiaBrand">AI fashion platform</p>
            <p className="truncate text-sm font-bold text-charcoal/58">{userLabel}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-charcoal transition hover:border-fuchsiaBrand/30 hover:text-fuchsiaBrand"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/30"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            className="relative flex h-full w-[min(320px,88vw)] flex-col bg-white p-5 shadow-soft"
          >
            <div className="flex shrink-0 items-center justify-between">
              <span className="text-sm font-black text-charcoal">Menu</span>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-full border border-black/10"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <AppNavigation close={() => setOpen(false)} />
            </div>
          </motion.aside>
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
