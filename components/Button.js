export default function Button({ children, onClick, type="button", disabled }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: disabled ? "#f3f3f3" : "#111",
        color: disabled ? "#999" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}