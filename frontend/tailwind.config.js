/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        card: '#12121a',
        'card-hover': '#1a1a24',
        border: '#1f1f2e',
        'border-hover': '#2a2a3e',
        primary: '#6366f1',
        'primary-light': '#818cf8',
        success: '#10b981',
        'success-light': '#34d399',
        warning: '#f59e0b',
        'warning-light': '#fbbf24',
        danger: '#ef4444',
        'danger-light': '#f87171',
        muted: '#71717a',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(99, 102, 241, 0.15)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
