export default function Field({ label, error, children }) {
  return (
    <label>
      {label}
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}
