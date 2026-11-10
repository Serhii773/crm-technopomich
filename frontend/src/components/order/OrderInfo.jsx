import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext.jsx';
import { updateDevice } from '../../api/operations.js';
import { DEVICE_FIELDS } from '../../utils/constants.js';
import { deviceToForm, normalizeDevice } from '../../utils/device.js';
import DeviceFields from '../DeviceFields.jsx';
import { devLabel, fmtDate } from '../../utils/format.js';
import useFormState from '../../hooks/useFormState.js';

/** Панелі «Клієнт і пристрій» та «Опис несправності». Менеджер може уточнити дані пристрою. */
export default function OrderInfo({ order, readOnly }) {
  const { sel, run, pending } = useStore();
  const c = sel.party(order.client), d = sel.dev(order.device);
  const [editing, setEditing] = useState(false); // показати форму редагування пристрою
  const f = useFormState({ type: d.type, ...deviceToForm(d) });

  const save = async (e) => {
    e.preventDefault();
    const res = await run(updateDevice, { deviceId: d.id, values: normalizeDevice(f.values) }); // PATCH /devices/:id
    if (res) setEditing(false);
  };

  return (
    <div className="grid2">
      <div className="panel">
        <h2>Клієнт і пристрій</h2>
        <dl className="kv">
          <dt>Клієнт</dt><dd>{readOnly ? c.name : <Link to={`/parties/${c.id}`}>{c.name}</Link>}</dd>
          <dt>Телефон</dt><dd className="mono">{c.phone || '—'}</dd>
          <dt>Пристрій</dt><dd>{d.type} · {devLabel(d)}</dd>
          {(DEVICE_FIELDS[d.type]?.sn || (d.sn && d.sn !== '—')) && <><dt>Серійний №</dt><dd className="mono">{d.sn && d.sn !== '—' ? d.sn : <span className="mute">не вказано</span>}</dd></>}
          {d.note && <><dt>Стан</dt><dd>{d.note}</dd></>}
          <dt>Створено</dt><dd className="num">{fmtDate(order.created)}</dd>
        </dl>
        {!readOnly && (editing ? (
          <form className="form" onSubmit={save} style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <DeviceFields f={f} names={{ type: 'type', brand: 'brand', model: 'model', sn: 'sn' }} />
            <div className="actions">
              <button className="btn sm pri" type="submit" disabled={pending}>Зберегти</button>
              <button className="btn sm" type="button" onClick={() => setEditing(false)}>Скасувати</button>
            </div>
          </form>
        ) : <button className="btn sm" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>Уточнити дані пристрою</button>)}
      </div>
      <div className="panel"><h2>Опис несправності</h2><p style={{ margin: 0 }}>{order.desc}</p></div>
    </div>
  );
}
