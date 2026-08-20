/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Pool Palette — Crystal Water (cyan)
        pool: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Navy Depth — focus & depth
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Mint — success metrics
        mint: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        // Soft elevation pool-style
        pool: '0 10px 30px -12px rgba(8, 145, 178, 0.18)',
        ring: '0 0 0 4px rgba(6, 182, 212, 0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out',
      },
    },
  },
  plugins: [],
}
