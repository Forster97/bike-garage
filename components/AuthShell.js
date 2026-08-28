"use client";

/**
 * AuthShell — el marco de las cuatro pantallas de sesión: entrar, registrarse,
 * recuperar y cambiar la contraseña.
 *
 * Existe porque las cuatro repetían el mismo encabezado, la misma tarjeta y el
 * mismo pie, cada una con sus propias clases. Y las cuatro estaban escritas en
 * una paleta —gris zinc y verde esmeralda— que no era la de la app: eran la
 * primera pantalla que ve alguien, y ya se veía distinta a lo que venía después.
 */

import { color, radio, espacio, texto, sombra } from "../lib/design";

export default function AuthShell({ titulo, bajada, children, pie }) {
  return (
    <main style={estilos.pantalla}>
      <div style={estilos.centro}>
        <div style={estilos.columna}>

          <div>
            <div style={estilos.marca}>
              <span style={estilos.punto} />
              Bike Garage
            </div>
            <h1 style={estilos.titulo}>{titulo}</h1>
            {bajada && <p style={estilos.bajada}>{bajada}</p>}
          </div>

          <div style={estilos.tarjeta}>{children}</div>

          {pie}

          <p style={estilos.pie}>© {new Date().getFullYear()} Bike Garage</p>
        </div>
      </div>
    </main>
  );
}

/** Un campo con su etiqueta, y un aviso opcional debajo. */
export function Campo({ etiqueta, extra, aviso, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: espacio.sm }}>
        <label style={estilos.etiqueta}>{etiqueta}</label>
        {extra}
      </div>
      {children}
      {aviso && <p style={estilos.aviso}>{aviso}</p>}
    </div>
  );
}

/** El mensaje de error del servidor. */
export function ErrorCaja({ children }) {
  if (!children) return null;
  return <div style={estilos.error}>{children}</div>;
}

/** El aviso de que algo salió bien. */
export function Aviso({ children }) {
  if (!children) return null;
  return <div style={estilos.aviso_ok}>{children}</div>;
}

/** Un enlace discreto: volver, olvidé mi contraseña, crear cuenta. */
export const enlaceTenue = {
  background: "none",
  border: 0,
  padding: 0,
  fontSize: texto.sm,
  color: color.texto.suave,
  textDecoration: "none",
  cursor: "pointer",
};

const estilos = {
  pantalla: { minHeight: "100svh", background: color.fondo, color: color.texto.fuerte },
  centro: {
    minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: `${espacio.xl}px ${espacio.lg}px`,
  },
  columna: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: espacio.lg },
  marca: {
    display: "inline-flex", alignItems: "center", gap: espacio.sm,
    borderRadius: radio.full, border: `1px solid ${color.borde.normal}`,
    background: color.superficie.alta, padding: "5px 12px",
    fontSize: texto.sm, color: color.texto.normal,
  },
  punto: { width: 8, height: 8, borderRadius: radio.full, background: color.accion.base },
  titulo: {
    margin: `${espacio.md}px 0 0`, fontSize: 30, fontWeight: texto.peso.maximo,
    letterSpacing: "-1px", color: color.texto.fuerte, lineHeight: 1.1,
  },
  bajada: { margin: "8px 0 0", fontSize: texto.md, color: color.texto.suave, lineHeight: 1.5 },
  tarjeta: {
    borderRadius: radio.xl, border: `1px solid ${color.borde.normal}`,
    background: color.superficie.media, padding: espacio.xl,
    boxShadow: sombra.media,
  },
  etiqueta: { fontSize: texto.base, fontWeight: texto.peso.medio, color: color.texto.normal },
  aviso: { margin: 0, fontSize: texto.sm, color: color.estado.proximo },
  aviso_ok: {
    borderRadius: radio.md, border: `1px solid ${color.estado.alDiaBorde}`,
    background: color.estado.alDiaTenue, padding: `10px ${espacio.md}px`,
    fontSize: texto.base, color: color.estado.alDiaTexto, lineHeight: 1.5,
  },
  error: {
    borderRadius: radio.md, border: `1px solid ${color.estado.vencidoBorde}`,
    background: color.estado.vencidoTenue, padding: `10px ${espacio.md}px`,
    fontSize: texto.base, color: color.estado.vencido, lineHeight: 1.5,
  },
  pie: { margin: 0, textAlign: "center", fontSize: texto.sm, color: color.texto.tenue },
};
