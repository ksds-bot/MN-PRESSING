import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',
        'primary-dark': '#1e40af',
        secondary: '#f3f4f6',
        accent: '#3b82f6',
        pressing: {
          rose: '#C81E6E',
          'rose-dark': '#A0164F',
          'rose-light': '#FDF2F8',
          sky: '#87CEEB',
          'sky-dark': '#3AA0D6',
          'sky-light': '#E0F2FE',
          ink: '#1A1A2E',
          pearl: '#FAFBFF',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-18px) translateX(8px) rotate(3deg)' },
          '66%': { transform: 'translateY(10px) translateX(-10px) rotate(-2deg)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '50%': { transform: 'translateY(20px) translateX(-14px) rotate(-4deg)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-slower': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(0) scale(0.6)', opacity: '0' },
          '10%': { opacity: '0.7' },
          '90%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-140px) scale(1.1)', opacity: '0' },
        },
        'steam-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '20%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-90px) scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'float-slower': 'float-slower 13s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        'spin-slower': 'spin-slower 22s linear infinite',
        'bubble-rise': 'bubble-rise 6s ease-in infinite',
        'steam-rise': 'steam-rise 4s ease-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        sway: 'sway 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3.5s ease-in-out infinite',
      },
      boxShadow: {
        premium: '0 20px 60px -15px rgba(200, 30, 110, 0.25), 0 8px 24px -8px rgba(26, 26, 46, 0.15)',
        'premium-sm': '0 8px 24px -8px rgba(200, 30, 110, 0.2)',
        glow: '0 0 0 3px rgba(200, 30, 110, 0.15)',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
