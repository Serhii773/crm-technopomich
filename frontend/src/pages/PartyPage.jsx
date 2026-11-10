import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { addInteraction } from '../api/operations.js';
import { PTYPE } from '../utils/constants.js';
import { devLabel, fmtDate, money } from '../utils/format.js';
import useFormState from '../hooks/useFormState.js';
import { required, validate } from '../utils/validation.js';
import Chip from '../components/Chip.jsx';
import ExecStars from '../components/ExecStars.jsx';
import Field from '../components/Field.jsx';
import OfferForm from '../components/OfferForm.jsx';
import { ORDER } from '../utils/constants.js';

export default function PartyPage() {
  const { id } = useParams();
  const { db, sel, run, pending } = useStore();
  const navigate = useNavigate();
  const f = useFormState({ type: 'Дзвінок', text: '' });
  const p = sel.party(id);
  if (!p) return <div className="empty">Контрагента не знайдено. <Link to="/parties">До списку</Link></div>;

  const isClient = p.type !== 'exec', isExec = p.type !== 'client';
  const devs = db.devices.filter((d) => d.owner === id);
  const orders = db.orders.filter((o) => o.client === id);
  const offers = db.offers.filter((x) => x.p === id);
  const its = db.interactions.filter((i) => i.party === id).sort((a, b) => b.date.localeCompare(a.date));
  const reviews = db.reviews.filter((r) => r.exec === id).sort((a, b) => b.date.localeCompare(a.date));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, { text: [(x) => required(x, 'Опишіть, про що домовились')] });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(addInteraction, { partyId: id, type: f.values.type, text: f.values.text.trim() }); // POST /interactions
    if (res) f.reset();
  };

  return (
    <>
      <div className="head">
        <div><div className="crumb"><Link to="/parties">Контрагенти</Link> / картка</div><h1>{p.name}</h1></div>
        <div className="actions">
          <span className="type">{PTYPE[p.type]}</span>
          {isClient && <button className="btn pri" onClick={() => navigate(`/orders/new?client=${id}`)}>+ Замовлення</button>}
        </div>
      </div>

      <div className="grid2">
        <div className="panel"><h2>Контакти</h2>
          <dl className="kv">
            <dt>Телефон</dt><dd className="mono">{p.phone || '—'}</dd>
            <dt>Email</dt><dd>{p.email || '—'}</dd>
            <dt>Адреса</dt><dd>{p.addr || '—'}</dd>
            {isExec && <><dt>Рейтинг</dt><dd><ExecStars id={p.id} /></dd></>}
          </dl>
        </div>
        <div className="panel"><h2>Історія взаємодій</h2>
          <form className="form" onSubmit={submit} noValidate>
            <div className="row"><Field label="Тип"><select {...f.bind('type')}><option>Дзвінок</option><option>Повідомлення</option><option>Email</option><option>Візит</option></select></Field></div>
            <Field label="Опис" error={f.errors.text}><input {...f.bind('text')} placeholder="Про що домовились" /></Field>
            <div><button className="btn sm" type="submit" disabled={pending}>Записати</button></div>
          </form>
          <div className="timeline" style={{ marginTop: 14 }}>
            {its.length ? its.map((i) => <div className="tl" key={i.id}><div className="d">{fmtDate(i.date)} · {i.type}</div>{i.text}</div>) : <span className="mute">Ще немає записів</span>}
          </div>
        </div>
      </div>

      {isClient && (
        <div className="grid2">
          <div className="panel"><h2>Пристрої</h2>
            {devs.length ? <div className="tbl-wrap"><table><thead><tr><th>Тип</th><th>Модель</th><th>S/N</th></tr></thead>
              <tbody>{devs.map((d) => <tr key={d.id}><td>{d.type}</td><td>{devLabel(d)}</td><td className="mono">{d.sn}</td></tr>)}</tbody></table></div>
              : <span className="mute">Пристроїв ще немає. Додайте при створенні замовлення.</span>}
          </div>
          <div className="panel"><h2>Замовлення</h2>
            {orders.length ? <div className="tbl-wrap"><table><tbody>
              {orders.map((o) => <tr key={o.id} className="click" onClick={() => navigate(`/orders/${o.id}`)}><td className="mono">{o.num}</td><td>{devLabel(sel.dev(o.device))}</td><td><Chip v={ORDER[o.status]} /></td></tr>)}
            </tbody></table></div> : <span className="mute">Замовлень ще немає</span>}
          </div>
        </div>
      )}

      {isExec && (
        <div className="grid2">
          <div className="panel"><h2>Послуги виконавця</h2>
            {offers.length ? <div className="tbl-wrap"><table><thead><tr><th>Послуга</th><th className="r">Ціна</th><th className="r">Термін</th></tr></thead>
              <tbody>{offers.map((x) => <tr key={x.s}><td>{sel.svc(x.s).name}</td><td className="r num">{money(x.price)}</td><td className="r num">{x.days} дн.</td></tr>)}</tbody></table></div>
              : <p className="note" style={{ margin: 0 }}>Послуг ще немає, тому виконавець не з'являється під час підбору. Додайте їх нижче або попросіть майстра зробити це у своєму кабінеті.</p>}
            <OfferForm partyId={id} bordered />
          </div>
          <div className="panel"><h2>Відгуки</h2>
            {reviews.length ? <div className="timeline">
              {reviews.map((r) => <div className="tl" key={r.id}><div className="d">{fmtDate(r.date)} · {r.ref} · <span className="stars">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span></div>{r.text || <span className="mute">без коментаря</span>}</div>)}
            </div> : <span className="mute">Відгуків ще немає. Менеджер оцінює виконавця після завершення етапу.</span>}
          </div>
        </div>
      )}
    </>
  );
}
