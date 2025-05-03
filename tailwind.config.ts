import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        maritime: {
          dark: '#0a0e14',
          deeper: '#060a0f',
          navy: '#0d1520',
          slate: '#151d2b',
          steel: '#1e2736',
          mist: '#2a3444',
        },
        rlusd: {
          primary: '#00d4aa',
          glow: '#00ffcc',
          dim: '#00a080',
        },
        accent: {
          amber: '#fbbf24',
          coral: '#f87171',
          sky: '#38bdf8',
          violet: '#a78bfa',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        }
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e2736' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'ocean-gradient': 'linear-gradient(180deg, #0a0e14 0%, #0d1520 50%, #060a0f 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(30, 39, 54, 0.8) 0%, rgba(21, 29, 43, 0.6) 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 212, 170, 0.15)',
        'glow-md': '0 0 20px rgba(0, 212, 170, 0.2)',
        'glow-lg': '0 0 40px rgba(0, 212, 170, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'wave': 'wave 8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 212, 170, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 212, 170, 0.5)' },
        },
        'wave': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
