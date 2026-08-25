/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad INVICTUS — verde esmeralda
        invictus: {
          50: '#EAF9F3',
          100: '#D0F2E6',
          200: '#A3E5CF',
          300: '#6DD4B4',
          400: '#2FBF97',
          500: '#00A878',
          600: '#00A878',
          700: '#007A5A',
          800: '#005C43',
          900: '#04402F',
          950: '#032B20',
        },
        // Base neutra institucional
        'azul-noche': '#071A2B',
        'azul-marino': '#102A43',
        'gris-fondo': '#F7F8FA',
        'gris-azulado': '#64748B',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 42 67 / 0.04), 0 1px 3px 0 rgb(16 42 67 / 0.05)',
        'card-hover': '0 4px 14px -2px rgb(16 42 67 / 0.10), 0 2px 6px -2px rgb(16 42 67 / 0.06)',
        modal: '0 24px 60px -12px rgb(7 26 43 / 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-16px) translateX(8px)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'translateY(10px) scale(.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
      animation: {
        'float-slow': 'float 11s ease-in-out infinite',
        'float-slower': 'float 15s ease-in-out infinite reverse',
        'fade-in': 'fade-in .18s ease-out both',
        'scale-in': 'scale-in .22s cubic-bezier(.16,1,.3,1) both',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
