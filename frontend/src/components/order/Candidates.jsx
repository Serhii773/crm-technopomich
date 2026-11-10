import { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import { assignStage } from '../../api/operations.js';
import { PTYPE } from '../../utils/constants.js';
import { money } from '../../utils/format.js';
import ExecStars from '../ExecStars.jsx';

/** Підбір виконавців для етапу: усі, хто надає послугу, з сортуванням за ціною або рейтингом. */
export default function Candidates({ stage, onClose }) {
  const { db, sel, run, pending } = useStore();
  const [sort, setSort] = useState('price');
  const name = sel.svc(stage.service).name;

  const list = db.offers.filter((x) => x.s === stage.service).map((x) => ({ ...x, party: sel.party(x.p) }));
  list.sort(sort === 'price' ? (a, b) => a.price - b.price : (a, b) => (sel.rating(b.p) ?? 0) - (sel.rating(a.p) ?? 0));

  if (!list.length) return <div className="note">Немає виконавців, які надають послугу «{name}». Додайте її виконавцю у розділі «Послуги».</div>;

  const assign = async (partyId) => {
    const res = await run(assignStage, { stageId: stage.id, partyId });   // PATCH /stages/:id
    if (res) onClose();
  };

  return (
    <>
      <div className="filters" style={{ marginBottom: 6 }}>
        <span className="mute" style={{ fontSize: 13, alignSelf: 'center' }}>Виконавці для «{name}», сортувати:</span>
        <button className="seg" aria-pressed={sort === 'price'} onClick={() => setSort('price')}>за ціною</button>
        <button className="seg" aria-pressed={sort === 'rating'} onClick={() => setSort('rating')}>за рейтингом</button>
        <button className="btn sm ghost" onClick={onClose}>Закрити</button>
      </div>
      <div className="cands">
        {list.map((x) => (
          <div className="cand" key={x.p}>
            <div>{x.party.name}<div className="mute" style={{ fontSize: 12 }}>{PTYPE[x.party.type]}</div></div>
            <span><ExecStars id={x.p} /></span>
            <span className="num">від {money(x.price)} · {x.days} дн.</span>
            <button className="btn sm pri" disabled={pending} onClick={() => assign(x.p)}>Призначити</button>
          </div>
        ))}
      </div>
    </>
  );
}
