/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
module.exports = {
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-overlay": {
          "scrollbar-gutter": "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
            position: "fixed",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#888",
            borderRadius: "4px",
          },
        },
      });
    },
  ],
};
