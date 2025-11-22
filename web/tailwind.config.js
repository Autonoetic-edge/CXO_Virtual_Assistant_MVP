/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#0066CC',
          600: '#0052A3',
          700: '#003D7A',
          800: '#002952',
          900: '#001429',
        },
        accent: {
          DEFAULT: '#FF6B35',
          50: '#FFE9E3',
          100: '#FFD4C7',
          200: '#FFAA8F',
          300: '#FF8057',
          400: '#FF6B35',
          500: '#FF5A1F',
          600: '#E6481A',
          700: '#CC3614',
          800: '#B3240F',
          900: '#99120A',
        },
      },
    },
  },
  plugins: [],
};
