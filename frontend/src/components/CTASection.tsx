"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { buttonClasses } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="bg-charcoal py-24 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="section-shell text-center"
      >
        <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-normal sm:text-6xl">
          Ready to Transform Your Wardrobe?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/62">
          Join users who never wonder what to wear anymore.
        </p>
        <Link
          href="/signup"
          className={buttonClasses({
            variant: "primary",
            size: "lg",
            className: "mt-9",
          })}
        >
          Start Free Trial
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  );
}
