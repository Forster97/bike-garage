// BackgroundGlow — efecto decorativo de fondo.
// Muestra gradientes de color en las esquinas para darle profundidad visual a la pantalla.
// aria-hidden="true" significa que los lectores de pantalla lo ignoran (es puramente decorativo).
// pointer-events-none evita que el elemento capture clics del mouse.
// fixed + inset-0 hace que cubra toda la pantalla sin moverse al hacer scroll.
export default function BackgroundGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          // Tres gradientes radiales superpuestos: morado (arriba izquierda), verde (arriba derecha), azul (abajo)
          "radial-gradient(800px 400px at 20% 0%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 350px at 100% 20%, rgba(34,197,94,0.14), transparent 55%), radial-gradient(600px 300px at 50% 100%, rgba(59,130,246,0.10), transparent 55%)",
      }}
    />
  );
}
