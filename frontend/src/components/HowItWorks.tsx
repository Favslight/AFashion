"use client";

import { motion } from "framer-motion";
import { steps } from "@/data/landing";
import { Card } from "@/components/ui/Card";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-blush py-24">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">How it works</p>
          <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
            From Closet to Confidence
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full p-7">
                <div className="grid size-12 place-items-center rounded-full bg-fuchsiaBrand text-lg font-black text-white shadow-pink">
                  {index + 1}
                </div>
                <h3 className="mt-7 text-2xl font-black text-charcoal">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/62">{step.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
