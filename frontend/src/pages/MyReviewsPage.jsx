import { useStore } from '../context/StoreContext.jsx';
import { fmtDate } from '../utils/format.js';
import ExecStars from '../components/ExecStars.jsx';

export default function MyReviewsPage() {
  const { db, sel, user } = useStore();
  const pid = user.party;
  const list = db.reviews.filter((r) => r.exec === pid).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="head"><div><div className="crumb">{sel.party(pid).name}</div><h1>Мої відгуки</h1></div></div>
      <div className="tiles">
        <div className="tile"><span className="k">Рейтинг</span><span className="v"><ExecStars id={pid} /></span></div>
        <div className="tile"><span className="k">Відгуків</span><span className="v">{list.length}</span></div>
      </div>
      <div className="panel"><div className="tbl-wrap"><table>
        <thead><tr><th>Дата</th><th>Замовлення</th><th>Оцінка</th><th>Коментар</th></tr></thead>
        <tbody>
          {list.length ? list.map((r) => (
            <tr key={r.id}>
              <td className="num">{fmtDate(r.date)}</td>
              <td className="mono">{r.ref}</td>
              <td><span className="stars">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span></td>
              <td>{r.text || <span className="mute">без коментаря</span>}</td>
            </tr>
          )) : <tr><td colSpan="4" className="empty">Відгуків ще немає. Менеджер оцінює виконавця після завершення етапу.</td></tr>}
        </tbody>
      </table></div></div>
    </>
  );
}
