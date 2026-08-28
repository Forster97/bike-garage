/**
 * lib/appUrl.js — de dónde sale la dirección pública de la app.
 *
 * BG-025: los cuatro sitios que la necesitaban tenían escrito
 * `process.env.NEXT_PUBLIC_APP_URL || "https://bike-garage.vercel.app"`.
 *
 * Ese dominio de respaldo **es la app de otra persona**. Verificado el
 * 2026-08-17: responde 200, se llama «Bike Garage» y redirige /login a
 * /auth/login, una ruta que nunca existió en este repositorio.
 *
 * O sea que si la variable faltaba en producción, en silencio:
 *   · el link de los correos mandaba a nuestros usuarios a una app ajena
 *   · el redirect_uri de Strava apuntaba ahí, y el código de autorización
 *     viajaba a un dominio de terceros
 *
 * Un respaldo que apunta al lugar equivocado es peor que no tener respaldo:
 * esconde el problema hasta que hace daño. Acá se falla fuerte y claro.
 */

const DOMINIO_AJENO = "https://bike-garage.vercel.app";

export function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL no está configurada. Sin ella no se puede construir " +
      "un link correcto: antes había un respaldo, pero apuntaba a una app de " +
      "terceros (BG-025). Configúrala en Vercel."
    );
  }

  if (url.replace(/\/$/, "") === DOMINIO_AJENO) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL apunta a ${DOMINIO_AJENO}, que es la app de otra ` +
      "persona, no esta. Ver BG-025."
    );
  }

  return url.replace(/\/$/, "");
}
