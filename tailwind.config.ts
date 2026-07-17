import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F6F3",
        panel: "#FFFFFF",
        ink: "#16171A",
        "ink-soft": "#6B6D76",
        "ink-faint": "#9A9BA3",
        line: "#E3E1DC",
        accent: {
          DEFAULT: "#3457D5",
          soft: "#EAF0FE",
          dark: "#2743AD",
        },
        signal: {
          twitter: "#3457D5",
          linkedin: "#0F6B5C",
          blog: "#B5472B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(22,23,26,0.04), 0 8px 24px -12px rgba(22,23,26,0.08)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out",
        "pulse-soft": "pulse-soft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
