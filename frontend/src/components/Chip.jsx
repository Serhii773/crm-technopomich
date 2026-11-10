export default function Chip({ v }) {
  return <span className={`chip ${v[1]}`}>{v[0]}</span>;
}
