"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { testimonials } from "@/data/landing";
import { Card } from "@/components/ui/Card";

export function Testimonials() {
  return (
    <section className="section-shell py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">Testimonials</p>
        <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
          Loved by Fashion Enthusiasts
        </h2>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.07 }}
          >
            <Card className="h-full p-7">
              <div className="flex gap-1 text-fuchsiaBrand" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className="size-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-6 text-base leading-8 text-charcoal/72">"{testimonial.quote}"</p>
              <div className="mt-7">
                <p className="font-black text-charcoal">{testimonial.name}</p>
                <p className="mt-1 text-sm font-semibold text-charcoal/50">{testimonial.role}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
