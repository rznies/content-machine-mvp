/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Copernicus', 'Tiempos Headline', 'Garamond', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          active: "var(--primary-active)",
          disabled: "var(--primary-disabled)",
        },
        ink: "var(--ink)",
        body: {
          DEFAULT: "var(--body)",
          strong: "var(--body-strong)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          soft: "var(--muted-soft)",
        },
        hairline: {
          DEFAULT: "var(--hairline)",
          soft: "var(--hairline-soft)",
        },
        canvas: "var(--canvas)",
        "surface-soft": "var(--surface-soft)",
        "surface-card": "var(--surface-card)",
        "surface-cream-strong": "var(--surface-cream-strong)",
        "surface-dark": "var(--surface-dark)",
        "surface-dark-elevated": "var(--surface-dark-elevated)",
        "surface-dark-soft": "var(--surface-dark-soft)",
        "on-primary": "var(--on-primary)",
        "on-dark": "var(--on-dark)",
        "on-dark-soft": "var(--on-dark-soft)",
        "accent-teal": "var(--accent-teal)",
        "accent-amber": "var(--accent-amber)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        // Compatibility bindings
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "9999px",
        full: "50%",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
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
    },
  },
  plugins: [],
}
