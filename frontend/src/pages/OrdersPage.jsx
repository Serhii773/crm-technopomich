import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { ORDER } from '../utils/constants.js';
import { devLabel, fmtDate, money } from '../utils/format.js';
import Chip from '../components/Chip.jsx';
import Progress from '../components/Progress.jsx';

export default function OrdersPage() {
  const { db, sel, user } = useStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');
  const readOnly = user.role === 'head';

  const list = [...db.orders]
    .sort((a, b) => b.created.localeCompare(a.created) || b.num.localeCompare(a.num, 'uk', { numeric: true }))
    .filter((o) => status === 'all' || o.status === status);

  const filters = [['all', 'Усі'], ...Object.entries(ORDER).map(([k, v]) => [k, v[0]])];
  const open = (id) => navigate(`/orders/${id}`);

  return (
    <>
      <div className="head">
        <div><div className="crumb">{readOnly ? 'Перегляд' : 'Робота з клієнтами'}</div><h1>Замовлення</h1></div>
        {!readOnly && <Link className="btn pri" to="/orders/new">+ Нове замовлення</Link>}
      </div>
      <div className="filters">
        {filters.map(([k, t]) => <button key={k} className="seg" aria-pressed={status === k} onClick={() => setStatus(k)}>{t}</button>)}
      </div>
      <div className="panel"><div className="tbl-wrap"><table>
        <thead><tr><th>№</th><th>Клієнт</th><th>Пристрій</th><th>Етапи</th><th>Статус</th><th className="r">Сума</th><th>Створено</th></tr></thead>
        <tbody>
          {list.length ? list.map((o) => (
            <tr key={o.id} className="click" tabIndex={0} onClick={() => open(o.id)} onKeyDown={(e) => e.key === 'Enter' && open(o.id)}>
              <td className="mono">{o.num}</td>
              <td>{sel.party(o.client).name}</td>
              <td>{devLabel(sel.dev(o.device))}</td>
              <td><Progress stages={sel.stagesOf(o.id)} /></td>
              <td>
                <Chip v={ORDER[o.status]} />
                {!readOnly && sel.stagesOf(o.id).some((t) => t.proposal) && <div style={{ fontSize: 12, color: 'var(--info)', marginTop: 4 }}>є повідомлення майстра</div>}
              </td>
              <td className="r num">{money(sel.orderTotal(o.id))}</td>
              <td className="num mute">{fmtDate(o.created)}</td>
            </tr>
          )) : <tr><td colSpan="7" className="empty">Немає замовлень з таким статусом</td></tr>}
        </tbody>
      </table></div></div>
    </>
  );
}
