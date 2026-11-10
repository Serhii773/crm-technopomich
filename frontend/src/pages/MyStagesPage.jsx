import { Fragment, useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { acceptStage, declineStage, finishStage, sendProposal } from '../api/operations.js';
import { DIAG } from '../utils/constants.js';
import { devLabel, money } from '../utils/format.js';
import useFormState from '../hooks/useFormState.js';
import { minNumber, required, validate } from '../utils/validation.js';
import DateRange from '../components/DateRange.jsx';
import Field from '../components/Field.jsx';

const GROUPS = [['asg', 'Нові, чекають на вашу відповідь'], ['run', 'В роботі'], ['done', 'Завершені']];

function MessageForm({ stage, onClose }) {
  const { run, pending } = useStore();
  const f = useFormState({ price: '', text: '' });
  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, { text: [(x) => required(x, 'Опишіть, що з’ясувалося')] });
    if (f.values.price !== '') Object.assign(errs, validate(f.values, { price: [minNumber(0, 'Ціна не може бути від’ємною')] }));
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(sendProposal, { stageId: stage.id, price: Number(f.values.price) || null, text: f.values.text.trim() }); // POST
    if (res) onClose();
  };
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="row"><Field label="Нова ціна, грн (якщо змінюється)" error={f.errors.price}><input type="number" min="0" step="50" placeholder={`зараз ${stage.price}`} {...f.bind('price')} /></Field></div>
      <Field label="Що з'ясувалося" error={f.errors.text}><textarea autoFocus {...f.bind('text')} placeholder="Напр.: для цієї моделі матриця дорожча, 4200 грн разом з роботою. Є на складі, заміна за 1 день." /></Field>
      <div className="actions"><button className="btn sm pri" type="submit" disabled={pending}>Надіслати менеджеру</button><button className="btn sm" type="button" onClick={onClose}>Скасувати</button></div>
    </form>
  );
}

function FinishForm({ stage, onClose }) {
  const { run, pending } = useStore();
  const isDiag = stage.service === DIAG;
  const f = useFormState({ text: '' });
  const submit = async (e) => {
    e.preventDefault();
    const errs = isDiag ? validate(f.values, { text: [(x) => required(x, 'Висновок діагностики обов’язковий')] }) : {};
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(finishStage, { stageId: stage.id, text: f.values.text.trim() }); // PATCH /stages/:id
    if (res) onClose();
  };
  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label={isDiag ? 'Висновок діагностики (обов\'язково): причина несправності, які роботи потрібні, орієнтовна ціна' : 'Коментар до виконаної роботи (необов\'язково)'} error={f.errors.text}>
        <textarea autoFocus {...f.bind('text')} placeholder={isDiag ? 'Напр.: згорів відеочип. Потрібно: заміна чипа, орієнтовно 4000 грн. Рекомендую чистку.' : 'Що зроблено'} />
      </Field>
      <div className="actions"><button className="btn sm pri" type="submit" disabled={pending}>Завершити етап</button><button className="btn sm" type="button" onClick={onClose}>Скасувати</button></div>
    </form>
  );
}

export default function MyStagesPage() {
  const { db, sel, user, run, pending } = useStore();
  const [panel, setPanel] = useState(null);
  const pid = user.party;
  const mine = db.stages.filter((t) => t.exec === pid);

  return (
    <>
      <div className="head"><div><div className="crumb">{sel.party(pid).name}</div><h1>Мої етапи</h1></div></div>
      {GROUPS.map(([k, title]) => {
        const list = mine.filter((x) => x.status === k);
        return (
          <div className="panel" key={k}>
            <h2>{title} <span className="mute num">{list.length}</span></h2>
            {list.length ? (
              <div className="tbl-wrap"><table>
                <thead><tr><th>Замовлення</th><th>Послуга</th><th>Пристрій</th><th>Опис</th><th>Строки</th><th className="r">Ціна</th><th /></tr></thead>
                <tbody>
                  {list.map((x) => {
                    const o = sel.order(x.order);
                    return (
                      <Fragment key={x.id}>
                        <tr>
                          <td className="mono">{o.num}</td>
                          <td>{sel.svc(x.service).name}</td>
                          <td>{devLabel(sel.dev(o.device))}</td>
                          <td style={{ minWidth: 240, maxWidth: 380, fontSize: 13 }}>
                            <span className="mute">Зі слів клієнта:</span> {o.desc}
                            {x.service !== DIAG && sel.diagOf(o.id) && <div style={{ marginTop: 6 }}><b>Діагностика:</b> {sel.diagOf(o.id)}</div>}
                            {x.proposal && <div style={{ marginTop: 6, color: 'var(--info)' }}>Ви повідомили менеджера{x.proposal.price ? `: пропонуєте ${money(x.proposal.price)}` : ''}. Чекає відповіді.</div>}
                            {x.reply && <div style={{ marginTop: 6, color: 'var(--ok)' }}>Менеджер: {x.reply}</div>}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}><DateRange t={x} /></td>
                          <td className="r num">{money(x.price)}{x.priceAgreed && <div style={{ fontSize: 12 }} className="mute">погоджено</div>}</td>
                          <td className="r"><div className="actions" style={{ justifyContent: 'flex-end' }}>
                            {k === 'asg' && <><button className="btn sm pri" disabled={pending} onClick={() => run(acceptStage, { stageId: x.id })}>Прийняти</button><button className="btn sm bad" disabled={pending} onClick={() => run(declineStage, { stageId: x.id })}>Відхилити</button></>}
                            {k === 'run' && <button className="btn sm pri" onClick={() => setPanel({ id: x.id, kind: 'finish' })}>Завершити</button>}
                            {k !== 'done' && <button className="btn sm" onClick={() => setPanel({ id: x.id, kind: 'msg' })}>Повідомити менеджера</button>}
                          </div></td>
                        </tr>
                        {panel?.id === x.id && <tr><td colSpan="7">{panel.kind === 'msg' ? <MessageForm stage={x} onClose={() => setPanel(null)} /> : <FinishForm stage={x} onClose={() => setPanel(null)} />}</td></tr>}
                        {k === 'done' && x.concl && <tr><td /><td colSpan="6" className="mute" style={{ fontSize: 13 }}>Висновок: {x.concl}</td></tr>}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table></div>
            ) : <span className="mute">{k === 'asg' ? 'Нових етапів немає. Коли менеджер призначить вас на етап, він з\'явиться тут.' : 'Порожньо'}</span>}
          </div>
        );
      })}
    </>
  );
}

