import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0e14",
          panel: "#0d1117",
          raised: "#151b23",
          border: "#242c38",
        },
        "surface-light": {
          DEFAULT: "#f6f8fa",
          panel: "#ffffff",
          raised: "#eef1f5",
          border: "#d8dee6",
        },
        ink: {
          DEFAULT: "#e6edf3",
          muted: "#8b96a5",
          faint: "#5a6472",
        },
        "ink-light": {
          DEFAULT: "#1b222c",
          muted: "#57616e",
          faint: "#8b96a5",
        },
        // semantic tokens -- the ghost-station finding is the product's
        // single most important signal, so it gets the most attention-
        // grabbing hue; everything else is deliberately calmer.
        ghost: "#ff6b5e",
        "confirmed-gone": "#2dd4a7",
        "no-match": "#5a6472",
        healthy: "#4fb8e8",
        degraded: "#f0a63c",
        risk: "#c76bf0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
