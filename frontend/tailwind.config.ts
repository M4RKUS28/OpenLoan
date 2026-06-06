import type { Config } from "tailwindcss";

/**
 * TradeFlow — "East-meets-West editorial fintech".
 * Warm ivory paper, deep Victoria-Harbour teal for dark sections, a signature
 * Hong Kong vermilion, jade for positive signals and gold for premium accents.
 */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: "#FBF6EC",
          dim: "#F4ECDB",
          deep: "#ECE1CB",
        },
        ink: {
          DEFAULT: "#1B1611",
          soft: "#3D362D",
          muted: "#736A5B",
        },
        line: {
          DEFAULT: "#E7DCC7",
          strong: "#D7C7A9",
        },
        brand: {
          DEFAULT: "#C2362A",
          600: "#A82A1E",
          700: "#8C2016",
          soft: "#E0917F",
          tint: "#F6E4DD",
        },
        jade: {
          DEFAULT: "#107A57",
          600: "#0C6045",
          soft: "#7CB79E",
          tint: "#E0EFE7",
        },
        gold: {
          DEFAULT: "#B0822B",
          soft: "#CBA34C",
          light: "#E6CD8C",
          tint: "#F5EBD4",
        },
        harbor: {
          DEFAULT: "#0B2129",
          950: "#06151A",
          900: "#0A2129",
          800: "#0F2E38",
          700: "#163E4A",
          600: "#1E5462",
          glow: "#2C7E8C",
        },
        // Semantic aliases (kept so any leftover template utilities resolve).
        background: "#FBF6EC",
        foreground: "#1B1611",
        border: "#E7DCC7",
        primary: { DEFAULT: "#C2362A", foreground: "#FBF6EC" },
        secondary: { DEFAULT: "#ECE1CB", foreground: "#1B1611" },
        muted: { DEFAULT: "#F4ECDB", foreground: "#736A5B" },
        accent: { DEFAULT: "#F5EBD4", foreground: "#1B1611" },
        card: { DEFAULT: "#FFFDF8", foreground: "#1B1611" },
        destructive: { DEFAULT: "#C2362A", foreground: "#FBF6EC" },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,22,17,0.04), 0 10px 30px -16px rgba(27,22,17,0.18)",
        lift: "0 30px 70px -32px rgba(27,22,17,0.40)",
        harbor: "0 30px 80px -30px rgba(6,21,26,0.65)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
      },
      letterSpacing: {
        tightish: "-0.015em",
        widest2: "0.22em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        // Scrolls the equirectangular earth texture for a rotating-globe illusion.
        "globe-spin": {
          "0%": { transform: "translate3d(0,0,0)" },
          "100%": { transform: "translate3d(-50%,0,0)" },
        },
        // Gentle 3D float for the hero card and accents.
        "float-y": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "float-y-slow": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-22px)" },
        },
        // Orbit ring satellite + the 3D spinning coin.
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(var(--orbit-r,140px)) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(var(--orbit-r,140px)) rotate(-360deg)" },
        },
        "coin-spin": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        // Slow cinematic zoom for full-bleed photo backdrops.
        "ken-burns": {
          "0%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1.16)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.6)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
        ticker: "ticker 40s linear infinite",
        "globe-spin": "globe-spin 48s linear infinite",
        "float-y": "float-y 7s ease-in-out infinite",
        "float-y-slow": "float-y-slow 9s ease-in-out infinite",
        orbit: "orbit 18s linear infinite",
        "coin-spin": "coin-spin 9s linear infinite",
        "ken-burns": "ken-burns 26s ease-out forwards",
        "pulse-glow": "pulse-glow 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
