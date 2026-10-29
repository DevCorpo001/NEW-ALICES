/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'rgb(237, 27, 36)',
          hover: 'rgb(205, 18, 26)',
          light: '#fef2f2',
        },
        surface: {
          DEFAULT: '#ffffff',
          ground: '#f8fafc',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};
