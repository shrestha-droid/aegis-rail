/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          light: '#D6DCED',
          soft: '#9FA8BF',
          medium: '#5F667A',
          dark: '#383C4D',
          mauve: '#A2758E',
          peach: '#FCDCCF',
          bg: '#161922',
          surface: '#222634',
          border: '#383C4D',
          hover: '#2C3143',
        }
      }
    },
  },
  plugins: [],
}