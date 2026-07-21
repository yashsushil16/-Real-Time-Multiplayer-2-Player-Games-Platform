/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'geo-main': '#F4F0EA',
        'geo-dark': '#1E1E24',
        'geo-yellow': '#FFD166',
        'geo-coral': '#FF5A5F',
        'geo-teal': '#06D6A0',
        'geo-purple': '#6C5CE7',
        'geo-blue': '#4EA8DE',
        'geo-[#FF70A6]': '#FF70A6',
      },
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'flat-sm': '2px 2px 0px #1E1E24',
        'flat': '4px 4px 0px #1E1E24',
        'flat-lg': '6px 6px 0px #1E1E24',
      }
    },
  },
  plugins: [],
}
