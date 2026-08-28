/** @type {import('tailwindcss').Config} */

// Los colores del sistema de diseño NO viven acá: viven en `lib/design.js`.
//
// Este archivo tenía su propia paleta —verde lima, grises pizarra, fondo
// #0b0f19— que no coincidía con lo que la app muestra de verdad. Ninguna
// pantalla la usaba: era una tercera versión de la identidad, contradiciendo
// a las otras dos. Se eliminó para que exista un solo lugar donde mirar.
//
// Tailwind sigue acá porque unas pocas pantallas usan sus utilidades de
// disposición (flex, grid, espaciados). Para color, medida o forma: lib/design.js.

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
