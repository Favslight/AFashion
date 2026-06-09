import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Style Quiz", href: "/style-quiz" },
      { label: "Community", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/dashboard" },
      { label: "Blog", href: "/dashboard" },
      { label: "Careers", href: "/dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/dashboard" },
      { label: "Terms", href: "/dashboard" },
      { label: "Security", href: "/dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-white py-12">
      <div className="section-shell grid gap-10 md:grid-cols-[1.2fr_1.8fr]">
        <div>
          <Link href="/" className="flex items-center gap-3" aria-label="What Should I Wear home">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-fuchsiaBrand to-roseBrand text-white shadow-pink">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-black tracking-tight text-charcoal sm:text-base">
              What Should I Wear?
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-charcoal/58">
            Your personal AI fashion assistant, always ready to help you look your best.
          </p>
          <p className="mt-8 text-sm font-semibold text-charcoal/45">
            © 2026 What Should I Wear? All rights reserved.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-black text-charcoal">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-semibold text-charcoal/56 transition hover:text-fuchsiaBrand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
