/**
 * components/Chevron.js
 *
 * Ícono de flecha (chevron) que rota 180° al abrirse.
 * Se usa en secciones colapsables de la UI.
 *
 * @param {{ open: boolean }} props
 */
export default function Chevron({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transition: "transform 0.22s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="rgba(255,255,255,0.40)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
