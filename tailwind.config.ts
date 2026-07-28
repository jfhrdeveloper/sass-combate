import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        borde: "hsl(214 20% 88%)",
        panel: "hsl(0 0% 100%)",
        fondo: "hsl(210 20% 98%)",
        roja: "hsl(0 72% 45%)",
        azul: "hsl(214 80% 45%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
