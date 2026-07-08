/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          50: '#e6f0ff',
          100: '#b3d4ff',
          200: '#80b8ff',
          300: '#4d9cff',
          400: '#1a80ff',
          500: '#0066cc',
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
          glow: '#00d4ff',
          blue: '#0088ff',
          purple: '#7c3aed',
          cyan: '#06b6d4',
          dark: '#0a0a1a',
          darker: '#050510',
          card: '#111122',
          border: '#1a1a3e',
          text: '#e2e8f0',
          muted: '#64748b',
        },
        neon: {
          blue: '#00b4ff',
          cyan: '#00f5ff',
          purple: '#b400ff',
          green: '#00ff88',
          red: '#ff0044',
          orange: '#ff6600',
          yellow: '#ffdd00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 180, 255, 0.3)',
        'neon-strong': '0 0 40px rgba(0, 180, 255, 0.5)',
        'glow': '0 0 15px rgba(0, 212, 255, 0.2)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
