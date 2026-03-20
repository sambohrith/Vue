/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1890ff',
          light: '#40a9ff',
          dark: '#096dd9',
        },
        secondary: {
          DEFAULT: '#13c2c2',
          light: '#48d1cc',
          dark: '#08979c',
        },
      },
    },
  },
  plugins: [],
}