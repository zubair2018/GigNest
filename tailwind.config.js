/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        cream: '#f6e9d0',
        forest: '#043222',
        gold: '#c9a84c',
      },
    },
  },
  plugins: [],
}
