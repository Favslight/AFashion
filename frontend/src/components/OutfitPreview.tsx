"use client";

import Link from "next/link";
import { Bookmark, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { outfitPreviews } from "@/data/landing";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

export function OutfitPreview() {
  return (
    <section className="section-shell py-24">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">
            Outfit previews
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
            Recommendations That Explain Themselves
          </h2>
        </div>
        <Link href="/signup" className={buttonClasses({ variant: "secondary" })}>
          Build my first look
        </Link>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {outfitPreviews.map((outfit, index) => (
          <motion.article
            key={outfit.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card className="flex h-full flex-col overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-fuchsiaBrand/10 via-white to-charcoal/[0.04] p-4">
                <div className="flex h-full items-end gap-2">
                  {outfit.palette.map((color) => (
                    <span
                      key={color}
                      className="flex-1 rounded-t-[24px] shadow-soft"
                      style={{ height: `${52 + index * 4}px`, backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-fuchsiaBrand">
                  {outfit.occasion}
                </p>
                <h3 className="mt-2 text-xl font-black text-charcoal">{outfit.title}</h3>
                <div className="mt-4 flex items-center gap-2">
                  <Sparkles className="size-4 text-fuchsiaBrand" aria-hidden="true" />
                  <span className="text-sm font-black text-charcoal">{outfit.score}% style score</span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-7 text-charcoal/62">{outfit.why}</p>
                <button
                  type="button"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white text-sm font-bold text-charcoal transition hover:border-fuchsiaBrand/30 hover:text-fuchsiaBrand"
                >
                  <Bookmark className="size-4" aria-hidden="true" />
                  Save look
                </button>
              </div>
            </Card>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
