/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4C83EE",
        success: "#22D172",
        danger: "#FF6B6B",
        warning: "#FFA500",
        dark: "#1F2937",
        light: "#F9FAFB",
      },
      fontFamily: {
        primary: ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
