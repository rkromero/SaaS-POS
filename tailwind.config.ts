/* eslint-disable ts/no-require-imports */
import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        lora: ['var(--font-lora)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      colors: {
        // ─── TuCaja Brand Palette — Navy + Esmeralda (v2.0) ──────────────────
        // Navy (confianza / autoridad)
        'n950': '#020617',
        'n900': '#0f172a',
        'n800': '#1e293b',
        'n700': '#334155',
        'n600': '#475569',
        'n500': '#64748b',
        'n400': '#94a3b8',
        'n300': '#cbd5e1',
        'n200': '#e2e8f0',
        'n100': '#f1f5f9',
        'n50': '#f8fafc',
        // Esmeralda (dinero / crecimiento)
        'e700': '#047857',
        'e600': '#059669',
        'e500': '#10b981',
        'e400': '#34d399',
        'e200': '#a7f3d0',
        'e100': '#d1fae5',
        'e50': '#ecfdf5',
        // Legado verde (mantenido para no romper componentes existentes)
        'g950': '#040e07',
        'g900': '#0d2318',
        'g800': '#1a5c2a',
        'g700': '#1e7a35',
        'g600': '#2a9444',
        'g500': '#3ab55a',
        'g400': '#5ecc7a',
        'g300': '#8ddfa0',
        'g200': '#b8edc5',
        'g100': '#dcf5e3',
        'g50': '#f3fdf6',
        'cream-dark': '#e8e2d4',
        'cream': '#faf8f3',
        'cream-light': '#fefdf9',
        // shadcn tokens
        'border': 'hsl(var(--border))',
        'input': 'hsl(var(--input))',
        'ring': 'hsl(var(--ring))',
        'background': 'hsl(var(--background))',
        'foreground': 'hsl(var(--foreground))',
        'primary': {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        'secondary': {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        'destructive': {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        'muted': {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        'accent': {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        'popover': {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        'card': {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
