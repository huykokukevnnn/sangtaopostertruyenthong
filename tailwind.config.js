/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'anton': ['Anton', 'sans-serif'],
        'pattaya': ['Pattaya', 'sans-serif'],
        'mali': ['Mali', 'cursive'],
        'be-vietnam': ['"Be Vietnam Pro"', 'sans-serif'],
        'luckiest': ['"Luckiest Guy"', 'cursive'],
        'bangers': ['Bangers', 'system-ui'],
      },
      boxShadow: {
        'cinema': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
