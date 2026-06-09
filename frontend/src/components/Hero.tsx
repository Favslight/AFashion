"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, CloudSun, ScanLine, Shirt, Sparkles, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function OutfitCard() {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsiaBrand">AI Pick</p>
          <h3 className="mt-2 text-lg font-black text-charcoal">Meeting Ready</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">96%</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {["Blazer", "Silk Top", "Trousers"].map((item, index) => (
          <div key={item} className="rounded-3xl border border-black/[0.06] bg-blush p-3">
            <div
              className="mb-3 h-20 rounded-2xl"
              style={{
                background:
                  index === 0
                    ? "linear-gradient(135deg,#171717,#444)"
                    : index === 1
                      ? "linear-gradient(135deg,#fff,#ffd6ea)"
                      : "linear-gradient(135deg,#2b2b2b,#f2f2f2)",
              }}
            />
            <p className="text-[11px] font-bold text-charcoal/70">{item}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-3xl bg-charcoal p-4 text-white">
        <p className="text-sm font-semibold">Polished neutrals with one soft accent.</p>
      </div>
    </Card>
  );
}

export function Hero() {
  return (
    <section className="section-shell grid min-h-[calc(100vh-80px)] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
      <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }} className="max-w-3xl">
        <motion.div variants={fadeUp}>
          <Badge>
            <Sparkles className="mr-2 size-3.5" aria-hidden="true" />
            AI-Powered Fashion Assistant
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-7 text-5xl font-black leading-[1.02] tracking-normal text-charcoal sm:text-6xl lg:text-7xl"
        >
          Your AI Stylist That Knows{" "}
          <span className="text-gradient-pink">Exactly What To Wear</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-7 max-w-2xl text-lg leading-8 text-charcoal/68">
          Transform your wardrobe with AI. Get personalized outfit recommendations, weather-based
          styling, cultural fashion advice, and fashion guidance that adapts to your unique taste.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-4 sm:flex-row">
          <Link href="/signup" className={buttonClasses({ size: "lg" })}>
            Get Started Free
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
          <Link href="#how-it-works" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            See How It Works
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative"
      >
        <div className="absolute -inset-6 rounded-[42px] bg-gradient-to-br from-fuchsiaBrand/15 via-white to-roseBrand/10 blur-2xl" />
        <div className="relative grid gap-4 rounded-[36px] border border-black/[0.05] bg-white/70 p-3 shadow-soft backdrop-blur sm:p-5">
          <OutfitCard />

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <ScanLine className="size-5 text-fuchsiaBrand" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold text-charcoal/55">Wardrobe scan</p>
              <p className="mt-1 text-xl font-black text-charcoal">42 items</p>
            </Card>
            <Card className="p-4">
              <WandSparkles className="size-5 text-fuchsiaBrand" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold text-charcoal/55">Style score</p>
              <p className="mt-1 text-xl font-black text-charcoal">94/100</p>
            </Card>
            <Card className="p-4">
              <CloudSun className="size-5 text-fuchsiaBrand" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold text-charcoal/55">Lagos weather</p>
              <p className="mt-1 text-xl font-black text-charcoal">Light layers</p>
            </Card>
          </div>

          <Card className="flex items-center gap-4 p-4">
            <div className="grid size-12 place-items-center rounded-full bg-fuchsiaBrand/10 text-fuchsiaBrand">
              <Shirt className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-charcoal">AI outfit preview</p>
              <p className="text-sm text-charcoal/58">Blazer, silk top, slim trousers, gold hoops</p>
            </div>
            <Check className="size-5 text-emerald-600" aria-hidden="true" />
          </Card>
        </div>
      </motion.div>
    </section>
  );
}
