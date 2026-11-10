import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money, monthLabel, today } from '../utils/format.js';
import ExecStars from '../components/ExecStars.jsx';

export default function StatsPage() {
  const { db, sel } = useStore();
  const [period, setPeriod] = useState('all');
  const months = [...new Set([today().slice(0, 7), ...db.orders.map((o) => o.created.slice(0, 7))])].sort().reverse();
  const orders = db.orders.filter((o) => period === 'all' || o.created.startsWith(period));
  const ids = new Set(orders.map((o) => o.id)); 
  const active = orders.filter((o) => o.status === 'work').length;
  const done = orders.filter((o) => o.status === 'done').length;
  const revenue = orders.filter((o) => o.status !== 'cancel').reduce((s, o) => s + sel.orderTotal(o.id), 0);
  const partnerSum = db.stages.filter((t) => ids.has(t.order) && t.exec && t.exec !== 'p1').reduce((s, t) => s + t.price, 0);

  // групування етапів за виконавцем
  const byExec = {};
  db.stages.filter((t) => ids.has(t.order) && t.exec).forEach((t) => {
    const e = byExec[t.exec] || (byExec[t.exec] = { n: 0, done: 0, sum: 0 });
    e.n++; if (t.status === 'done') e.done++; e.sum += t.price;
  });
  const rows = Object.entries(byExec).sort((a, b) => b[1].sum - a[1].sum);
  const max = Math.max(1, ...rows.map((r) => r[1].sum));

  const tiles = [['Усього замовлень', orders.length], ['У процесі', active], ['Виконано', done], ['Сума замовлень', money(revenue)], ['Передано партнерам', money(partnerSum)]];
  return (
    <>
      <div className="head">
        <div><div className="crumb">{period === 'all' ? 'За весь час' : monthLabel(period)}</div><h1>Статистика</h1></div>
        <label style={{ minWidth: 200 }}>Період
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Весь час</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </label>
      </div>
      <div className="tiles">{tiles.map(([k, v]) => <div className="tile" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>)}</div>
      <div className="panel"><h2>Виконавці за сумою робіт</h2><div className="tbl-wrap"><table>
        <thead><tr><th>Виконавець</th><th>Рейтинг</th><th className="r">Етапів</th><th className="r">Завершено</th><th style={{ width: '34%' }}>Сума</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="5" className="empty">За цей період немає призначених етапів</td></tr>}
          {rows.map(([pid, e]) => (
            <tr key={pid}>
              <td>{sel.party(pid).name}</td><td><ExecStars id={pid} /></td>
              <td className="r num">{e.n}</td><td className="r num">{e.done}</td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 8, borderRadius: 2, background: 'var(--accent)', width: `${Math.round((e.sum / max) * 100)}%`, minWidth: 2 }} />
                <span className="num" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{money(e.sum)}</span>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}
