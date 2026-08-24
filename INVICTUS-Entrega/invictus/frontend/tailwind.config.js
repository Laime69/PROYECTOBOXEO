/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        invictus: {
          50: '#fef2f2',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#f53e3e',
          600: '#e01e1e',
          700: '#bc1414',
          800: '#9c1616',
          900: '#811a1a',
          950: '#460808',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
