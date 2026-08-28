"use client";

/**
 * TapLink — un enlace que avisa que está trabajando.
 *
 * El problema que resuelve: las pantallas piden datos a la base al abrirse, así
 * que entre el toque y el cambio de pantalla pasa medio segundo largo en el que
 * NADA se movía. Se sentía como si el toque no hubiera entrado.
 *
 * `useLinkStatus` de Next sabe cuándo la navegación de ESTE enlace está en
 * curso. Mientras lo está, mostramos el mismo <Cargando/> de toda la app.
 *
 * Se usa igual que un <Link> normal.
 */

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import Cargando from "./Cargando";

/**
 * ¿Está tardando lo suficiente como para avisar?
 *
 * Si la pantalla ya estaba precargada, el cambio es instantáneo y la ruedita
 * alcanzaría a asomarse y desaparecer: un parpadeo. Eso se lee como un error,
 * no como una respuesta. Así que esperamos un cuarto de segundo antes de
 * mostrarla — por debajo de eso el cambio ya se siente inmediato y no hace
 * falta anunciar nada.
 */
function useTardando() {
  const { pending } = useLinkStatus();
  const [tardando, setTardando] = useState(false);

  useEffect(() => {
    if (!pending) { setTardando(false); return; }
    const t = setTimeout(() => setTardando(true), 250);
    return () => clearTimeout(t);
  }, [pending]);

  return tardando;
}

/**
 * Va DENTRO del <Link>: useLinkStatus solo funciona en un descendiente.
 * `reemplaza` cambia el contenido por la ruedita en vez de ponerla al lado —
 * útil cuando no sobra espacio.
 */
function Contenido({ children, reemplaza, tam, sinIndicador }) {
  const tardando = useTardando();

  if (sinIndicador) return children;
  if (tardando && reemplaza) return <Cargando tam={tam} />;

  return (
    <>
      {children}
      {tardando && <Cargando tam={tam} style={{ marginLeft: 8 }} />}
    </>
  );
}

/**
 * Pendiente — reemplaza SU contenido por la ruedita mientras el enlace que lo
 * envuelve está navegando.
 *
 * Sirve cuando el indicador tiene que ir en un sitio concreto y no al final:
 * en la tarjeta de una bici ocupa el lugar de la flecha, y en la barra de abajo
 * el del ícono. Poner la ruedita al final habría desarmado esas dos.
 *
 * Va dentro de un <TapLink sinIndicador>.
 */
export function Pendiente({ children, tam = 16 }) {
  return useTardando() ? <Cargando tam={tam} /> : children;
}

export default function TapLink({
  children,
  reemplaza = false,
  // `sinIndicador` cuando la pantalla coloca su propio <Pendiente/> adentro.
  sinIndicador = false,
  tam = 15,
  style,
  ...props
}) {
  return (
    <Link
      {...props}
      style={{ textDecoration: "none", ...style }}
      // La clase da la respuesta instantánea al dedo, antes de que la
      // navegación siquiera empiece. Está en globals.css.
      className={["tap", props.className].filter(Boolean).join(" ")}
    >
      <Contenido reemplaza={reemplaza} tam={tam} sinIndicador={sinIndicador}>{children}</Contenido>
    </Link>
  );
}
