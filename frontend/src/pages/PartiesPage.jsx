import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { addParty } from '../api/operations.js';
import { PTYPE } from '../utils/constants.js';
import useFormState from '../hooks/useFormState.js';
import { email, phone, required, validate } from '../utils/validation.js';
import ExecStars from '../components/ExecStars.jsx';
import Field from '../components/Field.jsx';

export default function PartiesPage() {
  const { db, run, pending } = useStore();
  const navigate = useNavigate();
  const [ptype, setPtype] = useState('all');
  const f = useFormState({ name: '', type: 'client', phone: '', email: '', addr: '' });

  const list = db.parties.filter((p) => ptype === 'all' || p.type === ptype || p.type === 'both');
  const open = (id) => navigate(`/parties/${id}`);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, { name: [(x) => required(x, 'Вкажіть назву або ПІБ')], phone: [phone], email: [email] });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const v = f.values;
    const res = await run(addParty, { name: v.name.trim(), type: v.type, phone: v.phone.trim(), email: v.email.trim(), addr: v.addr.trim() }); // POST /parties
    if (res) f.reset();
  };

  return (
    <>
      <div className="head"><div><div className="crumb">Замовники і виконавці в одній базі</div><h1>Контрагенти</h1></div></div>
      <div className="filters">
        {[['all', 'Усі'], ['client', 'Замовники'], ['exec', 'Виконавці']].map(([k, t]) => (
          <button key={k} className="seg" aria-pressed={ptype === k} onClick={() => setPtype(k)}>{t}</button>
        ))}
      </div>
      <div className="panel"><div className="tbl-wrap"><table>
        <thead><tr><th>Назва</th><th>Тип</th><th>Телефон</th><th>Email</th><th>Рейтинг</th><th className="r">Замовлень</th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="click" tabIndex={0} onClick={() => open(p.id)} onKeyDown={(e) => e.key === 'Enter' && open(p.id)}>
              <td>{p.name}</td>
              <td><span className="type">{PTYPE[p.type]}</span></td>
              <td className="mono">{p.phone}</td>
              <td>{p.email}</td>
              <td>{p.type === 'client' ? <span className="mute">—</span> : <ExecStars id={p.id} />}</td>
              <td className="r num">{db.orders.filter((o) => o.client === p.id).length || db.stages.filter((t) => t.exec === p.id).length || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      <form className="panel form" onSubmit={submit} noValidate>
        <h2>Додати контрагента</h2>
        <div className="row">
          <Field label="Назва або ПІБ" error={f.errors.name}><input {...f.bind('name')} /></Field>
          <Field label="Тип"><select {...f.bind('type')}>{Object.entries(PTYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        <div className="row">
          <Field label="Телефон" error={f.errors.phone}><input {...f.bind('phone')} placeholder="+380" /></Field>
          <Field label="Email" error={f.errors.email}><input {...f.bind('email')} /></Field>
          <Field label="Адреса"><input {...f.bind('addr')} /></Field>
        </div>
        <div><button className="btn pri" type="submit" disabled={pending}>Додати</button></div>
      </form>
    </>
  );
}
