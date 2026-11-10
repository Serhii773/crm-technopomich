import { useStore } from '../context/StoreContext.jsx';
import { addOffer } from '../api/operations.js';
import useFormState from '../hooks/useFormState.js';
import { minNumber, validate } from '../utils/validation.js';
import Field from './Field.jsx';

export default function OfferForm({ partyId, bordered, title }) {
  const { db, run, pending } = useStore();
  const free = db.services.filter((s) => !db.offers.some((x) => x.p === partyId && x.s === s.id));
  const f = useFormState({ s: '', price: '500', days: '2' });
  if (!free.length) return null;
  const serviceId = free.some((s) => s.id === f.values.s) ? f.values.s : free[0].id;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, {
      price: [minNumber(0, 'Ціна — число від 0')],
      days: [minNumber(1, 'Термін — щонайменше 1 день')],
    });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    await run(addOffer, { partyId, serviceId, price: Number(f.values.price), days: Number(f.values.days) }); // POST /offers
  };

  return (
    <form className={bordered ? 'form' : 'panel form'} onSubmit={submit} noValidate
      style={bordered ? { marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 } : undefined}>
      {title && <h2>{title}</h2>}
      <div className="row">
        <Field label="Послуга"><select name="s" value={serviceId} onChange={(e) => f.setValues((v) => ({ ...v, s: e.target.value }))}>{free.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Ціна, грн" error={f.errors.price}><input type="number" min="0" step="50" {...f.bind('price')} /></Field>
        <Field label="Термін, днів" error={f.errors.days}><input type="number" min="1" {...f.bind('days')} /></Field>
      </div>
      <div><button className={bordered ? 'btn sm pri' : 'btn pri'} type="submit" disabled={pending}>Додати послугу</button></div>
    </form>
  );
}
