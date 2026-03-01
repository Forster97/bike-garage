"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// ComboBox pro: escribe o elige, con teclado (↑↓ Enter Esc) y scroll al item activo
export default function ComboBox({
  value,
  onChange,
  options = [],
  placeholder,
  style,
  inputMode,
  minChars = 0, // pro-tip: pon 1 o 2 para marca/modelo si quieres
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const normalizedValue = String(value ?? "");

  // Filtrado memoizado
  const shown = useMemo(() => {
    const v = normalizedValue.trim().toLowerCase();
    const base = Array.isArray(options) ? options : [];

    // Normaliza (evita undefined/null)
    const clean = base
      .map((o) => String(o ?? ""))
      .filter((o) => o.trim().length > 0);

    // Sin escribir: muestra todo (limitado) solo si minChars=0
    if (!v) return minChars === 0 ? clean.slice(0, 12) : [];

    if (v.length < minChars) return [];

    const filtered = clean.filter((o) => o.toLowerCase().includes(v));
    return filtered.slice(0, 12);
  }, [options, normalizedValue, minChars]);

  const hasOptions = shown.length > 0;

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Asegura que active siempre esté dentro del rango cuando cambian opciones
  useEffect(() => {
    if (!open) return;
    if (!hasOptions) {
      setActive(-1);
      return;
    }
    setActive((prev) => (prev >= shown.length ? shown.length - 1 : prev));
  }, [open, hasOptions, shown.length]);

  // Scroll al item activo cuando navegas con teclado
  useEffect(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [open, active]);

  const selectOption = (opt) => {
    onChange(String(opt));
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!hasOptions) return;
      setActive((prev) => (prev < shown.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hasOptions) return;
      setActive((prev) => (prev > 0 ? prev - 1 : shown.length - 1));
      return;
    }

    if (e.key === "Enter") {
      if (active >= 0 && active < shown.length) {
        e.preventDefault();
        selectOption(shown[active]);
      } else {
        // Enter sin seleccionar: cierra (y deja el texto tal cual)
        setOpen(false);
        setActive(-1);
      }
      return;
    }
  };

  return (
    <div ref={containerRef} style={{ ...style, position: "relative" }}>
      <input
        value={normalizedValue}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        style={inputS}
        aria-autocomplete="list"
        aria-expanded={open ? "true" : "false"}
      />

      {open && hasOptions && (
        <ul ref={listRef} style={dropS} role="listbox">
          {shown.map((opt, i) => (
            <li
              key={`${opt}-${i}`}
              data-idx={i}
              role="option"
              aria-selected={active === i ? "true" : "false"}
              onMouseDown={(e) => {
                e.preventDefault(); // evita blur
                selectOption(opt);
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                ...optS,
                background: active === i ? "rgba(255,255,255,0.07)" : "transparent",
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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