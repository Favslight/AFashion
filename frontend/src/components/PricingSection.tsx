"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { pricingPlans } from "@/data/landing";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="bg-blush py-24">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">Pricing</p>
          <h2 className="mt-4 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mt-5 text-lg text-charcoal/62">Start free, upgrade anytime. No commitments.</p>

          <div className="mx-auto mt-8 inline-flex rounded-full border border-black/10 bg-white p-1 shadow-soft">
            {[
              { label: "Monthly", value: false },
              { label: "Yearly", value: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setYearly(option.value)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-black transition",
                  yearly === option.value ? "bg-charcoal text-white" : "text-charcoal/58",
                )}
              >
                {option.label}
                {option.value ? <span className="ml-2 text-fuchsiaBrand">Save 20%</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => {
            const price =
              yearly && plan.monthlyPrice > 0 ? Math.round(plan.monthlyPrice * 12 * 0.8) : plan.monthlyPrice;
            const period = yearly && plan.monthlyPrice > 0 ? "year" : plan.period;
            const popular = plan.id === "pro";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card
                  className={cn(
                    "relative flex h-full flex-col p-7",
                    popular && "border-fuchsiaBrand/35 shadow-pink",
                  )}
                >
                  {plan.badge ? <Badge className="mb-6 w-max">{plan.badge}</Badge> : null}
                  <h3 className="text-2xl font-black text-charcoal">{plan.name}</h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-charcoal/58">{plan.description}</p>
                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-normal text-charcoal">
                      {nairaFormatter.format(price)}
                    </span>
                    <span className="pb-1 text-sm font-bold text-charcoal/50">/ {period}</span>
                  </div>
                  <ul className="mt-8 flex flex-1 flex-col gap-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm leading-6 text-charcoal/68">
                        <Check className="mt-0.5 size-5 shrink-0 text-fuchsiaBrand" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/signup?plan=${plan.id}`}
                    className={buttonClasses({
                      variant: popular ? "primary" : "secondary",
                      className: "mt-8 w-full",
                    })}
                  >
                    {plan.id === "free" ? "Start Free" : "Choose Plan"}
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
