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
        bg: "#FFEFD5",
        text: "#3D2B1F",
        darkPrimary: "#FFB70F",
        darkBg: "#030843",
        darkText: "#E0CEC2"
      }
    },
  },
  plugins: [],
}

