"use client";

import { motion } from "framer-motion";
import { features } from "@/data/landing";
import { Card } from "@/components/ui/Card";

export function FeaturesSection() {
  return (
    <section id="features" className="section-shell py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">Features</p>
        <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
          Everything You Need to Look Amazing
        </h2>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: (index % 3) * 0.05 }}
            >
              <Card className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                <div className="grid size-12 place-items-center rounded-2xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-xl font-black text-charcoal">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/62">{feature.description}</p>
                <p className="mt-5 inline-flex rounded-full bg-charcoal/[0.04] px-3 py-1 text-xs font-bold text-charcoal/55">
                  {feature.backend}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
