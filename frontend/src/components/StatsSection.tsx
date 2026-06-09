"use client";

import { motion } from "framer-motion";
import { stats } from "@/data/landing";

export function StatsSection() {
  return (
    <section className="bg-charcoal py-14 text-white">
      <div className="section-shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.06 }}
            className="text-center"
          >
            <p className="text-4xl font-black tracking-normal sm:text-5xl">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold text-white/58">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
