import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#171717",
        ink: "#242124",
        blush: "#fff7fb",
        fuchsiaBrand: "#f20a83",
        roseBrand: "#ff4faf",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 23, 23, 0.08)",
        card: "0 16px 45px rgba(23, 23, 23, 0.09)",
        pink: "0 18px 42px rgba(242, 10, 131, 0.22)",
      },
      borderRadius: {
        card: "28px",
      },
    },
  },
  plugins: [],
};

export default config;
