import { useStore } from '../context/StoreContext.jsx';

export default function ExecStars({ id }) {
  const { sel } = useStore();
  const r = sel.rating(id);
  if (r == null) return <span className="type">новий</span>;
  return <><span className="stars">★ {r.toFixed(1)}</span> <span className="mute" style={{ fontSize: 12 }}>({sel.revCount(id)})</span></>;
}
