import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        // Cada token lee de una variable CSS (definida en globals.css, con
        // variante .dark): así "bg-fondo", "text-roja", etc. cambian solos
        // al alternar el tema, sin tocar los componentes que ya los usan.
        borde: "hsl(var(--borde) / <alpha-value>)",
        panel: "hsl(var(--panel) / <alpha-value>)",
        fondo: "hsl(var(--fondo) / <alpha-value>)",
        roja: "hsl(var(--roja) / <alpha-value>)",
        azul: "hsl(var(--azul) / <alpha-value>)",
        exito: {
          DEFAULT: "hsl(var(--exito) / <alpha-value>)",
          suave: "hsl(var(--exito-suave) / <alpha-value>)",
          fuerte: "hsl(var(--exito-fuerte) / <alpha-value>)",
        },
        aviso: {
          DEFAULT: "hsl(var(--aviso) / <alpha-value>)",
          suave: "hsl(var(--aviso-suave) / <alpha-value>)",
          fuerte: "hsl(var(--aviso-fuerte) / <alpha-value>)",
        },
        error: {
          DEFAULT: "hsl(var(--error) / <alpha-value>)",
          suave: "hsl(var(--error-suave) / <alpha-value>)",
          fuerte: "hsl(var(--error-fuerte) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          suave: "hsl(var(--info-suave) / <alpha-value>)",
          fuerte: "hsl(var(--info-fuerte) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
