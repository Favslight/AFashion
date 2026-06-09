"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks } from "@/data/landing";
import { buttonClasses } from "@/components/ui/Button";

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="What Should I Wear home">
      <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-fuchsiaBrand to-roseBrand text-white shadow-pink">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-black tracking-tight text-charcoal sm:text-base">
        What Should I Wear?
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.04] bg-white/82 backdrop-blur-xl">
      <nav className="section-shell flex h-20 items-center justify-between" aria-label="Main navigation">
        <BrandMark />

        <div className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-charcoal/70 transition hover:text-fuchsiaBrand"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            Login
          </Link>
          <Link href="/signup" className={buttonClasses({ variant: "primary", size: "sm" })}>
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-black/10 bg-white text-charcoal md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-black/[0.05] bg-white md:hidden"
          >
            <div className="section-shell flex flex-col gap-3 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl px-2 py-3 text-sm font-semibold text-charcoal/75"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className={buttonClasses({ variant: "primary", size: "sm" })}
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
