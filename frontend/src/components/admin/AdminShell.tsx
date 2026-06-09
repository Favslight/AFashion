"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adminModules } from "@/data/backendRoutes";
import { apiRequest, clearStoredToken } from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminData = {
  admin?: {
    full_name?: string;
    email?: string;
    role?: string;
  };
};

function AdminNavigation({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Admin navigation">
      {adminModules.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition",
              active ? "bg-charcoal text-white shadow-soft" : "text-charcoal/62 hover:bg-charcoal/[0.04]",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.title.replace("Admin ", "")}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [adminLabel, setAdminLabel] = useState("Admin");
  const router = useRouter();

  useEffect(() => {
    apiRequest<AdminData>("/api/admin/auth/me", { mode: "admin" })
      .then((response) => {
        const admin = response.data?.admin;
        setAdminLabel(admin?.full_name || admin?.email || admin?.role || "Admin");
      })
      .catch(() => setAdminLabel("Admin sign in required"));
  }, []);

  function logout() {
    clearStoredToken("admin");
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-black/[0.06] bg-white p-5 lg:flex">
        <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-charcoal text-white shadow-soft">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-black text-charcoal">Admin Console</span>
        </Link>
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
          <AdminNavigation />
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/88 backdrop-blur-xl lg:ml-72">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-black/10 bg-white text-charcoal lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsiaBrand">Management</p>
            <p className="text-sm font-bold text-charcoal/58">{adminLabel}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-charcoal transition hover:bg-charcoal hover:text-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-charcoal/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} className="relative flex h-full w-[min(320px,88vw)] flex-col bg-white p-5">
            <div className="flex shrink-0 items-center justify-between">
              <span className="text-sm font-black text-charcoal">Admin menu</span>
              <button className="grid size-10 place-items-center rounded-full border border-black/10" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <AdminNavigation close={() => setOpen(false)} />
            </div>
          </motion.aside>
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
