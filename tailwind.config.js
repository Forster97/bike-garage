/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(11 15 25 / <alpha-value>)",       // #0b0f19
        surface: "rgb(15 23 42 / <alpha-value>)",  // #0f172a
        card: "rgb(17 24 39 / <alpha-value>)",     // #111827
        border: "rgb(51 65 85 / <alpha-value>)",   // #334155
        text: "rgb(248 250 252 / <alpha-value>)",  // #f8fafc
        muted: "rgb(148 163 184 / <alpha-value>)", // #94a3b8
        primary: "rgb(132 204 22 / <alpha-value>)",// #84cc16
        primary2: "rgb(59 130 246 / <alpha-value>)"// #3b82f6
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.35)" },
    },
  },
  plugins: [],
};