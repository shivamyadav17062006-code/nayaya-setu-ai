/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9933',
          50: '#FFF5E6',
          100: '#FFE8C2',
          200: '#FFD199',
          300: '#FFBA70',
          400: '#FFA847',
          500: '#FF9933',
          600: '#E67A00',
          700: '#CC6A00',
          800: '#A35500',
          900: '#7A3F00',
        },
        secondary: {
          DEFAULT: '#138808',
          50: '#E8F5E6',
          100: '#C5E8C0',
          200: '#9ED899',
          300: '#77C870',
          400: '#50B848',
          500: '#138808',
          600: '#0F7006',
          700: '#0C5A05',
          800: '#084403',
          900: '#042E01',
        },
        accent: {
          DEFAULT: '#000080',
          50: '#E6E6FF',
          100: '#C0C0FF',
          200: '#9999FF',
          300: '#7070FF',
          400: '#4848FF',
          500: '#000080',
          600: '#000070',
          700: '#000060',
          800: '#000050',
          900: '#000040',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans Devanagari', 'Inter', 'system-ui', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-dot': 'bounceDot 1.2s infinite',
        'text-cycle': 'textCycle 0.5s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%': { transform: 'scale(1.2)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'gradient-saffron': 'linear-gradient(135deg, #FF9933 0%, #FFB347 100%)',
        'gradient-hero': 'linear-gradient(135deg, #FF9933 0%, #FF6B00 50%, #000080 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,153,51,0.08) 0%, rgba(19,136,8,0.08) 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.14)',
        'primary': '0 4px 16px rgba(255,153,51,0.35)',
        'secondary': '0 4px 16px rgba(19,136,8,0.25)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
