/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
  'after:content-[""]',
  'after:w-20',
  'after:h-1',
  'after:bg-black',
  'after:absolute',
  'after:bottom-0',
  'after:left-0',
  'after:right-0',
  'after:translate-y-1',
],
  theme: {
    extend: {
      animation: {
        'bounce': 'bounce 1s infinite',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'sans-serif'],
      },
       screens: {
        'xs': '375px', // iPhone Mini e simili
        'xxs': '320px', // Galaxy S8 e più piccoli
      },
    },
  },
  plugins: [],
}