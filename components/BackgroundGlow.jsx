export default function BackgroundGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(800px 400px at 20% 0%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 350px at 100% 20%, rgba(34,197,94,0.14), transparent 55%), radial-gradient(600px 300px at 50% 100%, rgba(59,130,246,0.10), transparent 55%)",
      }}
    />
  );
}