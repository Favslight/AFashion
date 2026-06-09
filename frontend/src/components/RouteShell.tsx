import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { apiBaseUrl } from "@/lib/api";

type RouteShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
};

export function RouteShell({ title, eyebrow, description, icon: Icon, children }: RouteShellProps) {
  return (
    <main className="min-h-screen bg-blush py-10">
      <div className="section-shell">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-charcoal/60">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>

        <div className="mx-auto mt-10 max-w-2xl">
          <Card className="p-6 sm:p-9">
            <div className="grid size-14 place-items-center rounded-3xl bg-fuchsiaBrand/10 text-fuchsiaBrand">
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-fuchsiaBrand">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-charcoal sm:text-5xl">{title}</h1>
            <p className="mt-5 text-base leading-8 text-charcoal/62">{description}</p>
            <p className="mt-4 rounded-2xl bg-charcoal/[0.04] px-4 py-3 text-sm font-semibold text-charcoal/55">
              API: {apiBaseUrl || "Set NEXT_PUBLIC_API_URL"}
            </p>
            <div className="mt-8">{children}</div>
          </Card>
        </div>
      </div>
    </main>
  );
}

export function FormField({
  label,
  type = "text",
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-charcoal">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fuchsiaBrand"
      />
    </label>
  );
}

export function PrimaryRouteButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className={buttonClasses({ className: "w-full" })}>
      {children}
    </button>
  );
}
