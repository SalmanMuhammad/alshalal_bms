/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'factory-blue': '#1e3a8a',
        'factory-red': '#dc2626',
        'factory-green': '#16a34a',
      }
    },
  },
  plugins: [],
}

