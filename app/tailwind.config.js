/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F2A900",
        bg: "#f4e4d4",
        text: "#1b1507",
        darkBg: "#122445",
        darkText: "#f8f1e3"
      }
    },
  },
  plugins: [],
}

