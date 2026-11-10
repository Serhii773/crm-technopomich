import { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { addStage } from '../../api/operations.js';
import { money } from '../../utils/format.js';
import StageRows from './StageRows.jsx';

/** Таблиця етапів ремонту, загальна сума й форма додавання нового етапу. */
export default function StagesPanel({ order, stages, readOnly }) {
  const { db, sel, run, pending } = useStore();
  const [service, setService] = useState(db.services[0].id);
  const [justAdded, setJustAdded] = useState(null); // id щойно доданого етапу — одразу відкриваємо підбір виконавця
  const closed = order.status === 'cancel' || order.status === 'done';

  const add = async (e) => {
    e.preventDefault();
    const res = await run(addStage, { orderId: order.id, serviceId: service });   // POST /stages
    if (res) setJustAdded(res.stageId);
  };

  return (
    <div className="panel">
      <h2>Етапи ремонту</h2>
      <div className="tbl-wrap"><table>
        <thead><tr><th>#</th><th>Послуга</th><th>Виконавець</th><th>Статус</th><th>Строки</th><th className="r">Ціна</th>{!readOnly && <th />}</tr></thead>
        <tbody>
          {stages.length
            ? stages.map((t) => <StageRows key={t.id} stage={t} order={order} readOnly={readOnly} defaultOpen={t.id === justAdded} />)
            : <tr><td colSpan="7" className="empty">Додайте перший етап: оберіть послугу нижче</td></tr>}
        </tbody>
      </table></div>
      <div className="total"><span className="mute">Загальна сума</span><b>{money(sel.orderTotal(order.id))}</b></div>
      {!readOnly && !closed && (
        <form className="form" onSubmit={add} style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <div className="row" style={{ alignItems: 'end' }}>
            <label>Додати етап: послуга
              <select value={service} onChange={(e) => setService(e.target.value)}>
                {db.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <div><button className="btn" type="submit" disabled={pending}>+ Додати етап</button></div>
          </div>
        </form>
      )}
    </div>
  );
}
