import { DIAG } from './constants.js';

export function makeSel(db) {
  const party = (id) => db.parties.find((p) => p.id === id);
  const svc = (id) => db.services.find((s) => s.id === id);
  const dev = (id) => db.devices.find((d) => d.id === id);
  const order = (id) => db.orders.find((o) => o.id === id);
  const stagesOf = (oid) => db.stages.filter((t) => t.order === oid).sort((a, b) => a.n - b.n);
  // сума замовлення = ціни етапів, на які вже призначено виконавця
  const orderTotal = (oid) => stagesOf(oid).reduce((s, t) => s + (t.exec ? t.price : 0), 0);
  // рейтинг виконавця = середня оцінка з відгуків
  const rating = (pid) => {
    const r = db.reviews.filter((x) => x.exec === pid);
    return r.length ? r.reduce((a, x) => a + x.score, 0) / r.length : null;
  };
  const revCount = (pid) => db.reviews.filter((x) => x.exec === pid).length;
  // висновок діагностики показуємо наступним виконавцям
  const diagOf = (oid) => {
    const t = db.stages.find((x) => x.order === oid && x.service === DIAG && x.concl);
    return t ? t.concl : '';
  };
  return { party, svc, dev, order, stagesOf, orderTotal, rating, revCount, diagOf };
}
