export default function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        outline: "none",
      }}
    />
  );
}