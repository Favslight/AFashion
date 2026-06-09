"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { faqs } from "@/data/landing";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section-shell py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">FAQ</p>
        <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
          Questions Before Your First Look
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {faqs.map((faq, index) => {
          const open = openIndex === index;

          return (
            <Card key={faq.question} className="overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span className="text-base font-black text-charcoal">{faq.question}</span>
                <ChevronDown
                  className={cn("size-5 shrink-0 text-fuchsiaBrand transition", open && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-6 text-sm leading-7 text-charcoal/62">{faq.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
