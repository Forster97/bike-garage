export default function Card({ children }) {
  return (
    <div style={{
      border: "1px solid #eee",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      background: "#fff"
    }}>
      {children}
    </div>
  );
}