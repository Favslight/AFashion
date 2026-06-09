"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarHeart, Heart, Loader2, RefreshCw, Shirt, Sparkles, WandSparkles, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type User = {
  full_name?: string | null;
  email?: string | null;
};

type WardrobeItem = {
  id: string;
  name: string;
  category?: string | null;
  color?: string | null;
  material?: string | null;
  image_url?: string | null;
  is_favorite?: boolean | null;
  created_at?: string | null;
};

type Outfit = {
  id: string;
  title?: string | null;
  occasion_slug?: string | null;
  overall_score?: number | string | null;
  created_at?: string | null;
};

type Subscription = {
  status?: string | null;
  plan?: {
    name?: string | null;
    max_wardrobe_items?: number | null;
    max_ai_generations_per_month?: number | null;
  } | null;
};

function greeting(name?: string | null, email?: string | null) {
  const label = name || email?.split("@")[0] || "there";
  return `Welcome back, ${label}`;
}

function categorySummary(items: WardrobeItem[]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = item.category || "Uncategorized";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const [userResult, subscriptionResult, wardrobeResult, outfitsResult] = await Promise.allSettled([
      apiRequest<{ user: User }>("/api/auth/me"),
      apiRequest<{ subscription: Subscription }>("/api/subscriptions/me"),
      apiRequest<{ items: WardrobeItem[] }>("/api/wardrobe"),
      apiRequest<{ outfits: Outfit[] }>("/api/outfits"),
    ]);

    if (userResult.status === "fulfilled") {
      setUser(userResult.value.data?.user ?? null);
    }

    if (subscriptionResult.status === "fulfilled") {
      setSubscription(subscriptionResult.value.data?.subscription ?? null);
    }

    if (wardrobeResult.status === "fulfilled") {
      setWardrobe(wardrobeResult.value.data?.items ?? []);
    }

    if (outfitsResult.status === "fulfilled") {
      setOutfits(outfitsResult.value.data?.outfits ?? []);
    }

    const firstError = [userResult, subscriptionResult, wardrobeResult, outfitsResult].find((result) => result.status === "rejected");
    if (firstError?.status === "rejected") {
      setError(firstError.reason instanceof Error ? firstError.reason.message : "Some dashboard data could not be loaded.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const categories = useMemo(() => categorySummary(wardrobe), [wardrobe]);
  const favoriteCount = wardrobe.filter((item) => item.is_favorite).length;
  const recentWardrobe = wardrobe.slice(0, 6);
  const planName = subscription?.plan?.name ?? "Free";

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] bg-charcoal p-5 text-white shadow-soft sm:p-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/75">
                AI fashion dashboard
              </span>
              <h1 className="mt-5 text-4xl font-black sm:text-5xl">{greeting(user?.full_name, user?.email)}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/65">
                Manage your wardrobe, generate outfit ideas, and keep your styling profile fresh from one clean workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/wardrobe" className={buttonClasses({ variant: "primary" })}>
                <Shirt className="mr-2 size-4" aria-hidden="true" />
                Add wardrobe
              </Link>
              <button type="button" onClick={loadDashboard} className={buttonClasses({ variant: "dark", className: "border border-white/15 bg-white/10 hover:bg-white/15" })}>
                <RefreshCw className={cn("mr-2 size-4", loading && "animate-spin")} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-3xl bg-amber-50 px-5 py-4 text-sm font-bold text-amber-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Shirt, label: "Wardrobe items", value: wardrobe.length, detail: `${favoriteCount} favorites` },
            { icon: WandSparkles, label: "Saved outfits", value: outfits.length, detail: "Ready for repeat looks" },
            { icon: WalletCards, label: "Current plan", value: planName, detail: subscription?.status ?? "Active" },
            { icon: CalendarHeart, label: "Categories", value: categories.length, detail: "Closet coverage" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {loading ? <Loader2 className="size-4 animate-spin text-charcoal/35" aria-hidden="true" /> : null}
                </div>
                <p className="mt-5 text-3xl font-black text-charcoal">{stat.value}</p>
                <p className="mt-1 text-sm font-black text-charcoal">{stat.label}</p>
                <p className="mt-2 text-sm font-semibold text-charcoal/50">{stat.detail}</p>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-charcoal">Recent wardrobe uploads</h2>
                <p className="mt-1 text-sm font-semibold text-charcoal/50">
                  Items you upload are pulled from the database and shown here.
                </p>
              </div>
              <Link href="/wardrobe" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Manage wardrobe
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </div>

            {loading ? (
              <div className="grid min-h-72 place-items-center">
                <Loader2 className="size-8 animate-spin text-fuchsiaBrand" aria-hidden="true" />
              </div>
            ) : recentWardrobe.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentWardrobe.map((item) => (
                  <Link key={item.id} href="/wardrobe" className="group overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
                    <div className="relative aspect-[4/5] bg-charcoal/[0.04]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid size-full place-items-center text-charcoal/30">
                          <Shirt className="size-12" aria-hidden="true" />
                        </div>
                      )}
                      {item.is_favorite ? (
                        <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-fuchsiaBrand shadow-soft">
                          <Heart className="size-4 fill-current" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <h3 className="truncate text-base font-black text-charcoal">{item.name}</h3>
                      <p className="mt-1 truncate text-sm font-semibold text-charcoal/50">
                        {[item.category, item.color, item.material].filter(Boolean).join(" / ") || "Details pending"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid min-h-72 place-items-center rounded-3xl border border-dashed border-black/10 bg-charcoal/[0.025] p-8 text-center">
                <div className="max-w-sm">
                  <Sparkles className="mx-auto size-10 text-fuchsiaBrand" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-black text-charcoal">Start your digital closet</h3>
                  <p className="mt-2 text-sm leading-7 text-charcoal/55">
                    Upload clothes, shoes, or bags and they will appear here after the save completes.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-xl font-black text-charcoal">Closet mix</h2>
              <div className="mt-5 space-y-3">
                {categories.length ? categories.map(([category, count]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm font-bold text-charcoal">
                      <span>{category}</span>
                      <span>{count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-charcoal/[0.06]">
                      <div className="h-full rounded-full bg-fuchsiaBrand" style={{ width: `${Math.max(12, (count / Math.max(wardrobe.length, 1)) * 100)}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-sm leading-7 text-charcoal/55">Add wardrobe items to see your closet distribution.</p>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-black text-charcoal">Next best actions</h2>
              <div className="mt-4 space-y-3">
                {[
                  { href: "/ai-stylist", label: "Ask the AI stylist" },
                  { href: "/outfits", label: "Generate an outfit" },
                  { href: "/wardrobe-health", label: "Analyze wardrobe health" },
                ].map((action) => (
                  <Link key={action.href} href={action.href} className="flex items-center justify-between rounded-2xl bg-charcoal/[0.035] px-4 py-3 text-sm font-black text-charcoal transition hover:bg-fuchsiaBrand/10 hover:text-fuchsiaBrand">
                    {action.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
