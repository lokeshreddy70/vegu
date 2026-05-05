/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vegu: {
          primary: '#FF6B35',
          accent: '#4DA167',
          yellow: '#FFD23F',
          red: '#C1272D',
        },
      },
    },
  },
  plugins: [],
};
