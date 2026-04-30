/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        elite: {
          orange: '#ff6600',
          cyan: '#00ffff',
          dark: '#1a1a1a',
          darker: '#0a0a0a',
          panel: '#1e1e1e',
          border: '#333333',
          text: '#ffffff',
          muted: '#888888',
        },
      },
      fontFamily: {
        eurostile: ['Eurostile', 'sans-serif'],
      },
    },
  },
  plugins: [],
};