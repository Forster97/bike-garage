"use client";
import { useEffect, useRef, useState } from "react";

// ── ComboBox ────────────────────────────────────────────────────────────────
// Input con sugerencias desplegables. Permite escribir libremente O elegir
// una opción de la lista filtrada en tiempo real.
//
// Props:
//   value       – valor actual (controlado)
//   onChange    – función(newValue) cuando el usuario escribe o elige
//   options     – array de strings con las sugerencias
//   placeholder – texto fantasma del input
//   style       – estilos para el contenedor (flex, minWidth, etc.)
//   inputMode   – "numeric" para campos de año, omitir para texto normal
export default function ComboBox({ value, onChange, options = [], placeholder, style, inputMode }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const containerRef = useRef(null);

  // Filtra las opciones según lo que el usuario ha escrito
  const filtered = value
    ? options.filter((o) => String(o).toLowerCase().includes(String(value).toLowerCase()))
    : options;

  // Muestra hasta 12 sugerencias para no saturar la pantalla
  const shown = filtered.slice(0, 12);

  // Cierra el dropdown si el usuario hace clic fuera del componente
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setHovered(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ ...style, position: "relative" }}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHovered(-1); }}
        onFocus={() => { setOpen(true); setHovered(-1); }}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        style={inputS}
      />

      {/* Dropdown de sugerencias – aparece solo si hay opciones y el input está activo */}
      {open && shown.length > 0 && (
        <ul style={dropS}>
          {shown.map((opt, i) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                // preventDefault evita que el input pierda el foco antes de registrar el clic
                e.preventDefault();
                onChange(String(opt));
                setOpen(false);
                setHovered(-1);
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
              style={{ ...optS, background: hovered === i ? "rgba(255,255,255,0.07)" : "transparent" }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Estilos internos ────────────────────────────────────────────────────────
const inputS = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.90)",
  fontSize: 14,
  outline: "none",
};

const dropS = {
  listStyle: "none",
  margin: 0,
  padding: "4px 0",
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 50,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#0e1118",
  boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
  maxHeight: 200,
  overflowY: "auto",
};

const optS = {
  padding: "9px 14px",
  fontSize: 14,
  color: "rgba(255,255,255,0.85)",
  cursor: "pointer",
};
