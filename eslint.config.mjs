import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // ── BG-036 ────────────────────────────────────────────────────────────────
  // `no-undef` atrapa una variable que quedó sin importar tras un refactor.
  //
  // Es el error que más ha llegado a producción en este proyecto: el build de
  // Next compila igual, porque es JavaScript sin tipos, y la app revienta en
  // silencio dentro del manejador de un click — sin alerta, sin mensaje, sin
  // pista. Así fue como el botón Guardar dejó de hacer nada.
  //
  // Next no la trae activada porque asume que usas TypeScript.
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "no-undef": "error",
    },
  },

  // Los tests corren en vitest, que aporta sus propios globales.
  {
    files: ["**/*.test.js", "**/*.test.jsx"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
];

export default eslintConfig;
