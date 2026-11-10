import { useStore } from '../../context/StoreContext.jsx';
import { addInteraction } from '../../api/operations.js';
import { DIAG } from '../../utils/constants.js';
import { fmtDate } from '../../utils/format.js';
import useFormState from '../../hooks/useFormState.js';
import { required, validate } from '../../utils/validation.js';
import Field from '../Field.jsx';

/** Висновок діагностики + форма запису дзвінка клієнту (погодження робіт і ціни). */
export default function DiagnosisPanel({ order, stages, readOnly }) {
  const { db, sel, run, pending } = useStore();
  const f = useFormState({ text: '' });
  const diag = stages.filter((t) => t.service === DIAG);
  if (!diag.length) return null;
  const done = diag.filter((t) => t.concl);

  if (!done.length) {
    return (
      <div className="panel"><h2>Висновок діагностики</h2>
        <span className="mute">{diag[0].exec ? 'Діагностика ще триває. Висновок майстра з\'явиться тут.' : 'Спершу призначте виконавця на етап «Діагностика».'}</span>
      </div>
    );
  }
  const later = stages.some((t) => t.service !== DIAG); // вже додано етапи ремонту
  const calls = db.interactions.filter((i) => i.party === order.client && i.order === order.num);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, { text: [(x) => required(x, 'Запишіть результат розмови')] });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(addInteraction, { partyId: order.client, orderNum: order.num, type: 'Дзвінок', text: f.values.text.trim() });
    if (res) f.reset();
  };

  return (
    <div className="panel" style={{ borderColor: 'var(--accent)' }}>
      <h2>Висновок діагностики</h2>
      {done.map((t) => (
        <div key={t.id}>
          <p style={{ margin: '0 0 6px' }}>{t.concl}</p>
          <div className="mute" style={{ fontSize: 13 }}>{sel.party(t.exec).name} · {fmtDate(t.doneAt)}</div>
        </div>
      ))}
      {!readOnly && (
        <div className="form" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <form className="form" onSubmit={submit} noValidate>
            <Field label="Результат розмови з клієнтом" error={f.errors.text}>
              <input {...f.bind('text')} placeholder="Напр.: погодилась на заміну чипа і чистку, разом до 4500 грн" />
            </Field>
            <div><button className="btn sm" type="submit" disabled={pending}>Записати дзвінок</button></div>
          </form>
          {calls.length > 0 && (
            <div className="timeline">
              {calls.map((i) => <div className="tl" key={i.id}><div className="d">{fmtDate(i.date)} · {i.type}</div>{i.text}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
