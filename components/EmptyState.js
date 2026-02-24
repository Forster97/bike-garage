import Button from "./Button";

export default function EmptyState({ title, desc, ctaText, onCta }) {
  return (
    <div style={{
      border: "1px dashed #ddd",
      borderRadius: 16,
      padding: 18,
      textAlign: "center",
      background: "#fafafa"
    }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ marginTop: 8, color: "#555" }}>{desc}</p>
      {ctaText && <Button onClick={onCta}>{ctaText}</Button>}
    </div>
  );
}