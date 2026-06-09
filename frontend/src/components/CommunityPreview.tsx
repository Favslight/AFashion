"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { communityTiles } from "@/data/landing";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function CommunityPreview() {
  return (
    <section className="bg-white py-24">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">
            Community inspiration
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
            Save Looks, Follow Taste, Build Better Boards
          </h2>
          <p className="mt-5 text-lg leading-8 text-charcoal/62">
            The discovery layer connects community posts, creators, style boards, saved outfits,
            and AI-ranked inspiration so your feed feels useful instead of noisy.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 text-sm font-black text-fuchsiaBrand"
          >
            Start discovering
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="columns-1 gap-5 sm:columns-2">
          {communityTiles.map((tile, index) => (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.05 }}
              className="mb-5 break-inside-avoid"
            >
              <Card className="overflow-hidden">
                <div
                  className={cn(
                    index % 2 === 0 ? "h-44" : "h-56",
                    "bg-gradient-to-br",
                    tile.tone,
                  )}
                />
                <div className="p-5">
                  <h3 className="text-lg font-black text-charcoal">{tile.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-charcoal/60">{tile.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
