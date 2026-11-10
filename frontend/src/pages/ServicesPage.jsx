import { useStore } from '../context/StoreContext.jsx';
import { addService } from '../api/operations.js';
import { money } from '../utils/format.js';
import useFormState from '../hooks/useFormState.js';
import { required, validate } from '../utils/validation.js';
import Field from '../components/Field.jsx';

export default function ServicesPage() {
  const { db, sel, run, pending } = useStore();
  const f = useFormState({ name: '', cat: '' });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, { name: [(x) => required(x, 'Вкажіть назву послуги')] });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(addService, { name: f.values.name.trim(), cat: f.values.cat.trim() }); // POST /services
    if (res) f.reset();
  };

  return (
    <>
      <div className="head"><div><div className="crumb">Довідник</div><h1>Послуги</h1></div></div>
      <div className="panel"><div className="tbl-wrap"><table>
        <thead><tr><th>Послуга</th><th>Категорія</th><th>Виконавці</th><th className="r">Ціна від</th></tr></thead>
        <tbody>
          {db.services.map((s) => {
            const o = db.offers.filter((x) => x.s === s.id);
            return (
              <tr key={s.id}>
                <td>{s.name}</td><td className="mute">{s.cat}</td>
                <td>{o.length ? o.map((x) => sel.party(x.p).name).join(', ') : <span className="mute">немає</span>}</td>
                <td className="r num">{o.length ? money(Math.min(...o.map((x) => x.price))) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
      <form className="panel form" onSubmit={submit} noValidate>
        <h2>Нова послуга</h2>
        <div className="row">
          <Field label="Назва" error={f.errors.name}><input {...f.bind('name')} /></Field>
          <Field label="Категорія"><input {...f.bind('cat')} placeholder="Апаратне, Програмне…" /></Field>
        </div>
        <div><button className="btn pri" type="submit" disabled={pending}>Додати</button></div>
      </form>
    </>
  );
}
