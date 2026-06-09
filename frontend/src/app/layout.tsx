import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What Should I Wear? | AI Fashion Styling",
  description:
    "Your personal AI fashion assistant for outfit recommendations, wardrobe intelligence, weather styling, cultural fashion guidance, and style memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
