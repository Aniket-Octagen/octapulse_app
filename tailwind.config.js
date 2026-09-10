// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {},
    extend: {
      animation: {
        shine: "shine 3s linear infinite",
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "-100% 0" },
        },
      },
      fontFamily: {
        sans: ["'Open Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
