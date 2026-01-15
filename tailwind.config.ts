import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#a36e6c",
          dark: "#8a5a58",
          light: "#b88a88",
          pink: "#FFE5E5",
          pinkLight: "#FFF5F5",
        },
        secondary: {
          DEFAULT: "#5d7184",
          dark: "#4a5a6a",
          light: "#7a8fa3",
        },
        background: {
          DEFAULT: "#FFF8F0",
          light: "#FFFBF5",
          beige: "#F5F0E8",
        },
        accent: {
          orange: "#FF6B35",
          pink: "#FFB6C1",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

