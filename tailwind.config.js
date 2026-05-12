/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c9",
          400: "#8592ab",
          500: "#667591",
          600: "#515e78",
          700: "#434d62",
          800: "#3a4253",
          900: "#343a47",
          950: "#13151b",
        },
        accent: {
          DEFAULT: "#3b82f6",
          warm: "#f59e0b",
          red: "#ef4444",
          green: "#22c55e",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        display: ['"Instrument Serif"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
