import Button from "./Button";

export default function Navbar({ email, onLogout }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 18px",
      borderBottom: "1px solid #eee",
      position: "sticky",
      top: 0,
      background: "white",
      zIndex: 10
    }}>
      <div style={{ fontWeight: 800 }}>Bike Garage</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: "#555", fontSize: 14 }}>{email}</span>
        <Button onClick={onLogout}>Salir</Button>
      </div>
    </div>
  );
}