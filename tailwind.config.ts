import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: "#0B2D6B",
        coral: "#E8602C",
        cream: "#F7F4EF",
        "cream-dark": "#EDE9E2",
        signal: "#E8602C",
        branco: "#FFFFFF",
        preto: "#1A1A1A",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      }
    }
  },
  plugins: []
}
export default config
