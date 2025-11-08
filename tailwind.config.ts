import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          bg: "hsl(var(--sidebar-bg))",
        },
        "editor-bg": "hsl(var(--editor-bg))",
        "doc-sidebar-bg": "hsl(var(--doc-sidebar-bg))",
        "doc-sidebar-border": "hsl(var(--doc-sidebar-border))",
        "doc-nav-hover": "hsl(var(--doc-nav-hover))",
        "doc-nav-active": "hsl(var(--doc-nav-active))",
        "code-bg": "hsl(var(--code-bg))",
        "inline-code-bg": "hsl(var(--inline-code-bg))",
        "inline-code-text": "hsl(var(--inline-code-text))",
        // Landing page colors
        neon: "hsl(var(--neon-green))",
        "neon-bright": "hsl(var(--neon-green-bright))",
        "dark-gray": "hsl(var(--dark-gray))",
        "menu-bar": "hsl(var(--menu-bar))",
        "tag-background": "hsl(var(--tag-background))",
        "symbol-black": "hsl(var(--symbol-black))",
        "symbol-green": "hsl(var(--symbol-green))",
        "feature-purple": "hsl(var(--feature-purple))",
        "feature-lavender": "hsl(var(--feature-lavender))",
        "feature-lime": "hsl(var(--feature-lime))",
        "feature-navy": "hsl(var(--feature-navy))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        section: "var(--spacing-section)",
        block: "var(--spacing-block)",
        element: "var(--spacing-element)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(-4px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "preview-in": {
          "0%": { opacity: "0", transform: "translateX(-8px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" }
        },
        "preview-out": {
          "0%": { opacity: "1", transform: "translateX(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateX(-8px) scale(0.96)" }
        },
        "folder-expand": {
          "0%": { height: "0", opacity: "0" },
          "100%": { height: "auto", opacity: "1" }
        },
        "drag-lift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" }
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
        "preview-in": "preview-in 0.15s ease-out",
        "preview-out": "preview-out 0.1s ease-in",
        "folder-expand": "folder-expand 0.2s ease-out",
        "drag-lift": "drag-lift 0.15s ease-out",
        marquee: "marquee 25s linear infinite"
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
