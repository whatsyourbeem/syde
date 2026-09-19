import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}", // Added this line
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#002040",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sydeblue: "#002040",
        sydeorange: "#ED6D34",
        alabasterwhite: "#FAFAFA",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontSize: {
        "log-content": "15px",
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground))",
            // Default bullets (gray-300) were nearly invisible; links matched body text too closely to notice.
            "--tw-prose-bullets": "#6b7280",
            "--tw-prose-links": "#2563eb",
            a: {
              fontWeight: "500",
              textUnderlineOffset: "3px",
              textDecorationColor: "rgb(37 99 235 / 0.4)",
            },
            "a:hover": { textDecorationColor: "currentColor" },
            // Plain strings: theme("fontSize.*") returns [size, { lineHeight }], which typography silently drops.
            // Body headings stay below the post title (40px desktop / 30px mobile), like velog. Mobile sizes: globals.css.
            h1: {
              fontSize: "2rem",
              fontWeight: theme("fontWeight.bold"),
            },
            h2: {
              fontSize: "1.625rem",
              fontWeight: theme("fontWeight.bold"),
            },
            h3: {
              fontSize: "1.3125rem",
              fontWeight: theme("fontWeight.bold"),
            },
            h4: {
              fontSize: "1.125rem",
              fontWeight: theme("fontWeight.bold"),
            },
            // Typography's defaults add curly quotes to blockquotes and backticks around inline code;
            // authors type their own quotes, so they doubled up, and backticks read as unrendered markdown.
            "blockquote p:first-of-type::before": { content: "none" },
            "blockquote p:last-of-type::after": { content: "none" },
            blockquote: { fontStyle: "normal" },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
            code: {
              backgroundColor: "rgb(243 244 246)",
              borderRadius: "0.25rem",
              padding: "0.125rem 0.375rem",
              fontWeight: "500",
            },
            "pre code": {
              backgroundColor: "transparent",
              borderRadius: "0",
              padding: "0",
              fontWeight: "inherit",
            },
          },
        },
        sm: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground))",
            h1: {
              fontSize: theme("fontSize.2xl"),
              fontWeight: theme("fontWeight.bold"),
            },
            h2: {
              fontSize: theme("fontSize.xl"),
              fontWeight: theme("fontWeight.bold"),
            },
            h3: {
              fontSize: theme("fontSize.lg"),
              fontWeight: theme("fontWeight.bold"),
            },
            h4: {
              fontSize: theme("fontSize.base"),
              fontWeight: theme("fontWeight.bold"),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
} satisfies Config;
