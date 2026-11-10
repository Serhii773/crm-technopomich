import { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { addReview, approveProposal, deleteStage, rejectProposal, setStagePrice } from '../../api/operations.js';
import { STAGE } from '../../utils/constants.js';
import { fmtDate, money } from '../../utils/format.js';
import useFormState from '../../hooks/useFormState.js';
import { minNumber, validate } from '../../utils/validation.js';
import Chip from '../Chip.jsx';
import DateRange from '../DateRange.jsx';
import ExecStars from '../ExecStars.jsx';
import Candidates from './Candidates.jsx';
import Field from '../Field.jsx';

/**
 * Один етап у таблиці + «розкривні» рядки під ним.
 * Локальний стан розкривних блоків: який блок зараз відкрито (none|price|pick|rate).
 */
export default function StageRows({ stage: t, order, readOnly, defaultOpen }) {
  const { db, sel, run, pending, user } = useStore();
  const [open, setOpen] = useState(defaultOpen ? 'pick' : 'none');
  const priceForm = useFormState({ price: String(t.price) });
  const rateForm = useFormState({ score: '5', text: '' });
  const cancelled = order.status === 'cancel';
  const review = db.reviews.find((r) => r.stage === t.id);
  const colSpan = readOnly ? 5 : 6;

  const savePrice = async (e) => {
    e.preventDefault();
    const errs = validate(priceForm.values, { price: [minNumber(0, 'Ціна не може бути від’ємною')] });
    priceForm.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(setStagePrice, { stageId: t.id, price: Number(priceForm.values.price) }); // PATCH
    if (res) setOpen('none');
  };
  const saveReview = async (e) => {
    e.preventDefault();
    const res = await run(addReview, { stageId: t.id, score: Number(rateForm.values.score), text: rateForm.values.text.trim(), authorId: user.id }); // POST /reviews
    if (res) setOpen('none');
  };

  return (
    <>
      <tr>
        <td className="num">{t.n}</td>
        <td>{sel.svc(t.service).name}</td>
        <td>{t.exec ? <>{sel.party(t.exec).name} <ExecStars id={t.exec} /></> : <span className="mute">не призначено</span>}</td>
        <td><Chip v={STAGE[t.status]} /></td>
        <td style={{ whiteSpace: 'nowrap' }}><DateRange t={t} /></td>
        <td className="r num">
          {t.exec ? (open === 'price' ? (
            <form onSubmit={savePrice} noValidate style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <input type="number" min="0" step="50" {...priceForm.bind('price')} style={{ width: 100 }} aria-label="Фактична ціна" />
              <button className="btn sm pri" type="submit" disabled={pending}>OK</button>
            </form>
          ) : (
            <>
              {money(t.price)}
              {t.priceAgreed ? <div style={{ fontSize: 12 }} className="mute">погоджено</div> : t.status !== 'done' && <div style={{ fontSize: 12 }} className="mute">орієнтовна</div>}
            </>
          )) : '—'}
          {open === 'price' && priceForm.errors.price && <div className="field-error">{priceForm.errors.price}</div>}
        </td>
        {!readOnly && (
          <td className="r">
            {t.exec && t.status !== 'done' && !cancelled && open !== 'price' && <><button className="btn sm" onClick={() => setOpen('price')}>Змінити ціну</button>{' '}</>}
            {!t.exec && !cancelled && <button className="btn sm pri" onClick={() => setOpen('pick')}>Підібрати виконавця</button>}
            {t.status === 'done' && t.exec && (review
              ? <span className="stars">ваша оцінка {'★'.repeat(review.score)}</span>
              : <button className="btn sm" onClick={() => setOpen('rate')}>Оцінити</button>)}
            {t.status !== 'done' && !cancelled && <> <button className="btn sm ghost" aria-label="Видалити етап" disabled={pending} onClick={() => run(deleteStage, { stageId: t.id })}>✕</button></>}
          </td>
        )}
      </tr>

      {open === 'pick' && <tr><td /><td colSpan={colSpan}><Candidates stage={t} onClose={() => setOpen('none')} /></td></tr>}

      {t.proposal && !readOnly && (
        <tr><td /><td colSpan="6">
          <div className="note" style={{ background: 'var(--info-soft)', color: 'var(--ink)' }}>
            <b>{sel.party(t.exec).name} повідомляє</b> ({fmtDate(t.proposal.date)}): {t.proposal.text}
            {t.proposal.price && <><br />Пропонована ціна: <b className="num">{money(t.proposal.price)}</b> замість {money(t.price)}</>}
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn sm pri" disabled={pending} onClick={() => run(approveProposal, { stageId: t.id })}>{t.proposal.price ? 'Клієнт погодився, змінити ціну' : 'Прочитано'}</button>
              <button className="btn sm bad" disabled={pending} onClick={() => run(rejectProposal, { stageId: t.id })}>{t.proposal.price ? 'Клієнт відмовився' : 'Відхилити'}</button>
            </div>
          </div>
        </td></tr>
      )}

      {open === 'rate' && (
        <tr><td /><td colSpan="6">
          <form className="form" onSubmit={saveReview}>
            <div className="row" style={{ alignItems: 'end' }}>
              <Field label={`Оцінка для «${sel.party(t.exec).name}»`}>
                <select {...rateForm.bind('score')}>
                  <option value="5">★★★★★ 5, відмінно</option><option value="4">★★★★ 4, добре</option><option value="3">★★★ 3, задовільно</option>
                  <option value="2">★★ 2, погано</option><option value="1">★ 1, дуже погано</option>
                </select>
              </Field>
              <Field label="Коментар"><input {...rateForm.bind('text')} placeholder="Вчасно? Якісно? Чи скаржився клієнт?" /></Field>
              <div className="actions">
                <button className="btn sm pri" type="submit" disabled={pending}>Зберегти відгук</button>
                <button className="btn sm" type="button" onClick={() => setOpen('none')}>Скасувати</button>
              </div>
            </div>
          </form>
        </td></tr>
      )}
    </>
  );
}
