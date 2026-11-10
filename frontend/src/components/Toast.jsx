import { useStore } from '../context/StoreContext.jsx';

export default function Toast() {
  const { toast } = useStore();
  return <div className={`toast ${toast ? 'on' : ''} ${toast?.kind === 'err' ? 'err' : ''}`} id="toast" role="status" aria-live="polite">{toast?.msg}</div>;
}
