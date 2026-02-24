module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        extend: {
          colors: {
            bg: "#0b0f19",
            surface: "#0f172a",
            card: "#111827",
            border: "#334155",
            text: "#f8fafc",
            muted: "#94a3b8",
            primary: "#84cc16",
            primary2: "#3b82f6",
          },
        },
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.35)" },
    },
  },
  plugins: [],
};