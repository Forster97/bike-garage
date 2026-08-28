/**
 * El manifiesto que convierte la web en una app instalable (PRD-11.6).
 *
 * Con esto, "Añadir a pantalla de inicio" deja de abrir una pestaña de
 * navegador y abre Bike Garage a pantalla completa, con su ícono, como
 * cualquier otra app del teléfono.
 *
 * Next lo sirve en /manifest.webmanifest a partir de este archivo.
 */

import { color } from "../lib/design";

export default function manifest() {
  return {
    name: "Bike Garage",
    short_name: "Bike Garage",
    description: "Anticípate a las mantenciones antes de que tu bici se rompa.",
    lang: "es-CL",

    // `standalone` es lo que quita la barra del navegador.
    display: "standalone",
    orientation: "portrait",

    // Arranca en el garage, no en la landing: quien instaló la app ya
    // decidió que la quiere usar, no que quiere leer de qué se trata.
    start_url: "/garage",
    scope: "/",

    // Los mismos colores de la app. El de fondo es el que se ve en el
    // instante entre tocar el ícono y que cargue la pantalla.
    background_color: color.fondo,
    theme_color: color.fondo,

    icons: [
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
