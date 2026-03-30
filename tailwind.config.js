/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a5c8a',
          50:  '#f0f7fb',
          100: '#d9ecf5',
          200: '#b0d8ec',
          300: '#79bde0',
          400: '#3f9dd1',
          500: '#1e82ba',
          600: '#0a5c8a',
          700: '#09507a',
          800: '#0b3f5e',
          900: '#0c3450',
        },
        accent: '#e86b2d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
