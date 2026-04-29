/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        arabic: ["'Noto Naskh Arabic'", "serif"],
      },
      colors: {
        blush: {
          50: "#fdf6f0",
          100: "#fae8d8",
          200: "#f5cdb0",
          300: "#eeab80",
          400: "#e5834d",
          500: "#de6530",
          600: "#cf5025",
          700: "#ac3e21",
          800: "#893323",
          900: "#6e2d20",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e4ece3",
          200: "#c9d9c8",
          300: "#a0bd9f",
          400: "#739c71",
          500: "#537f51",
          600: "#406540",
          700: "#345235",
          800: "#2b422c",
          900: "#253726",
        },
        cream: "#fdf8f3",
      },
    },
  },
  plugins: [],
};
