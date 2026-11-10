
import { DIAG } from '../utils/constants.js';
import { money, today } from '../utils/format.js';

const nid = (db, prefix) => { db.seq.id++; return prefix + db.seq.id; };
const byId = (list, id) => list.find((x) => x.id === id);
const stagesOf = (db, oid) => db.stages.filter((t) => t.order === oid).sort((a, b) => a.n - b.n);
const orderTotal = (db, oid) => stagesOf(db, oid).reduce((s, t) => s + (t.exec ? t.price : 0), 0);
const svcName = (db, id) => byId(db.services, id).name;

const mastersOf = (db, partyId) => db.users.filter((u) => u.role === 'master' && u.party === partyId).map((u) => u.id);
function notify(db, userIds, text, link) {
  userIds.forEach((uid) => db.notifications.push({ id: nid(db, 'n'), user: uid, text, link, date: today(), read: false }));
}
function notifyManager(db, t, what) {
  const o = byId(db.orders, t.order);
  notify(db, [o.manager], `${byId(db.parties, t.exec).name} ${what} «${svcName(db, t.service)}» (${o.num})`, `/orders/${o.id}`);
}

function recalc(db, oid) {
  const o = byId(db.orders, oid);
  if (!o || o.status === 'cancel') return;
  const st = stagesOf(db, oid);
  if (st.length && st.every((t) => t.status === 'done') && st.some((t) => t.service !== DIAG)) o.status = 'done';
  else if (st.some((t) => t.exec)) o.status = 'work';
  else o.status = 'new';
}

/* ───────── Замовлення ───────── */
export function createOrder(db, { clientId, newClient, deviceId, newDevice, desc, managerId }) {
  let cl = clientId;
  if (newClient) {
    cl = nid(db, 'p');
    db.parties.push({ id: cl, type: 'client', addr: '', rating: null, ...newClient });
  }
  let did = deviceId;
  if (newDevice) {
    did = nid(db, 'd');
    db.devices.push({ id: did, owner: cl, ...newDevice });
  }
  const oid = nid(db, 'o');
  const num = 'Р-' + db.seq.order++;
  db.orders.push({ id: oid, num, client: cl, device: did, desc, created: today(), status: 'new', manager: managerId });
  // Перший етап «Діагностика» додається автоматично
  db.stages.push({ id: nid(db, 't'), order: oid, n: 1, service: DIAG, exec: null, status: 'wait', price: 0, due: '' });
  const pc = byId(db.parties, cl);
  return {
    orderId: oid,
    msg: !pc.phone && !pc.email
      ? `Замовлення створено. Клієнт без контактів: видайте квитанцію ${num}.`
      : 'Замовлення створено. Додайте етапи ремонту.',
  };
}
export function cancelOrder(db, { orderId }) {
  const o = byId(db.orders, orderId);
  o.status = 'cancel';
  // виконавців, чиї етапи ще не завершені, сповіщаємо про скасування
  db.stages.filter((t) => t.order === orderId && t.exec && t.status !== 'done')
    .forEach((t) => notify(db, mastersOf(db, t.exec), `Замовлення ${o.num} скасовано, етап «${svcName(db, t.service)}» більше не потрібен`, '/my-stages'));
  db.stages.forEach((t) => { if (t.order === orderId && t.status !== 'done') t.status = 'wait'; });
  return { msg: 'Замовлення скасовано' };
}
export function updateDevice(db, { deviceId, values }) {
  Object.assign(byId(db.devices, deviceId), values);
  return { msg: 'Дані пристрою оновлено' };
}

/* ───────── Етапи ───────── */
export function addStage(db, { orderId, serviceId }) {
  const id = nid(db, 't');
  db.stages.push({ id, order: orderId, n: stagesOf(db, orderId).length + 1, service: serviceId, exec: null, status: 'wait', price: 0, due: '' });
  return { stageId: id };
}
export function deleteStage(db, { stageId }) {
  const t = byId(db.stages, stageId);
  db.stages = db.stages.filter((x) => x.id !== stageId);
  stagesOf(db, t.order).forEach((x, i) => { x.n = i + 1; }); // перенумерація
  recalc(db, t.order);
  return { msg: 'Етап видалено' };
}
export function assignStage(db, { stageId, partyId }) {
  const t = byId(db.stages, stageId);
  const offer = db.offers.find((x) => x.p === partyId && x.s === t.service);
  const due = new Date(); due.setDate(due.getDate() + offer.days);
  Object.assign(t, { exec: partyId, price: offer.price, status: 'asg', start: today(), due: due.toISOString().slice(0, 10) });
  recalc(db, t.order);
  notify(db, mastersOf(db, partyId), `Вам призначено етап «${svcName(db, t.service)}» (замовлення ${byId(db.orders, t.order).num})`, '/my-stages');
  return { msg: `Етап призначено: ${byId(db.parties, partyId).name}. Виконавця сповіщено.` };
}
export function setStagePrice(db, { stageId, price }) {
  const t = byId(db.stages, stageId), o = byId(db.orders, t.order), old = t.price;
  t.price = price; t.priceAgreed = true;
  db.interactions.push({ id: nid(db, 'i'), party: o.client, order: o.num, date: today(), type: 'Дзвінок', text: `Погоджено ціну етапу «${svcName(db, t.service)}» (${o.num}): ${money(old)} → ${money(price)}.` });
  notify(db, mastersOf(db, t.exec), `Ціну етапу «${svcName(db, t.service)}» (${o.num}) змінено на ${money(price)}`, '/my-stages');
  return { msg: `Ціну змінено. Загальна сума ${o.num}: ${money(orderTotal(db, o.id))}` };
}
export function acceptStage(db, { stageId }) {
  const t = byId(db.stages, stageId); t.status = 'run'; recalc(db, t.order);
  notifyManager(db, t, 'прийняв етап');
  return { msg: 'Етап прийнято. Статус: «Виконується»' };
}
export function declineStage(db, { stageId }) {
  const t = byId(db.stages, stageId);
  notifyManager(db, t, 'відхилив етап (потрібен інший виконавець)'); // до скидання виконавця
  Object.assign(t, { status: 'wait', exec: null, price: 0, due: '', start: '' });
  recalc(db, t.order);
  return { msg: 'Етап відхилено. Менеджер підбере іншого виконавця.' };
}
export function finishStage(db, { stageId, text }) {
  const t = byId(db.stages, stageId);
  t.status = 'done'; t.doneAt = today();
  if (text) t.concl = text;
  recalc(db, t.order);
  const o = byId(db.orders, t.order);
  notifyManager(db, t, t.service === DIAG ? 'завершив діагностику, є висновок:' : 'завершив етап');
  return { msg: t.service === DIAG ? 'Діагностику завершено. Менеджер отримав висновок.' : o.status === 'done' ? `Етап завершено. Замовлення ${o.num} виконане!` : 'Етап завершено' };
}
export function sendProposal(db, { stageId, price, text }) {
  const t = byId(db.stages, stageId);
  t.proposal = { price: price && price !== t.price ? price : null, text, date: today() };
  delete t.reply;
  notifyManager(db, t, 'надіслав повідомлення щодо етапу');
  return { msg: 'Повідомлення надіслано менеджеру' };
}
export function approveProposal(db, { stageId }) {
  const t = byId(db.stages, stageId), o = byId(db.orders, t.order), pr = t.proposal;
  if (pr.price) {
    db.interactions.push({ id: nid(db, 'i'), party: o.client, order: o.num, date: today(), type: 'Дзвінок', text: `Погоджено нову ціну етапу «${svcName(db, t.service)}»: ${money(t.price)} → ${money(pr.price)}.` });
    t.price = pr.price; t.priceAgreed = true; t.reply = `ціну ${money(pr.price)} погоджено з клієнтом`;
  } else t.reply = 'прочитано';
  delete t.proposal;
  notify(db, mastersOf(db, t.exec), `Менеджер відповів щодо етапу «${svcName(db, t.service)}» (${o.num}): ${t.reply}`, '/my-stages');
  return { msg: pr.price ? `Ціну змінено. Загальна сума ${o.num}: ${money(orderTotal(db, o.id))}` : 'Позначено як прочитане' };
}
export function rejectProposal(db, { stageId }) {
  const t = byId(db.stages, stageId), o = byId(db.orders, t.order), pr = t.proposal;
  if (pr.price) db.interactions.push({ id: nid(db, 'i'), party: o.client, order: o.num, date: today(), type: 'Дзвінок', text: `Клієнт не погодився на нову ціну етапу «${svcName(db, t.service)}» (${money(pr.price)}).` });
  t.reply = pr.price ? 'клієнт не погодився на нову ціну, працюємо за попередньою або етап буде скасовано' : 'відхилено';
  delete t.proposal;
  notify(db, mastersOf(db, t.exec), `Менеджер відповів щодо етапу «${svcName(db, t.service)}» (${o.num}): ${t.reply}`, '/my-stages');
  return { msg: 'Відповідь надіслано майстру' };
}

/* ───────── Взаємодії, відгуки ───────── */
export function addInteraction(db, { partyId, orderNum, type, text }) {
  db.interactions.push({ id: nid(db, 'i'), party: partyId, ...(orderNum ? { order: orderNum } : {}), date: today(), type, text });
  return { msg: orderNum ? 'Дзвінок записано. Тепер додайте погоджені етапи.' : 'Взаємодію записано' };
}
export function addReview(db, { stageId, score, text, authorId }) {
  const t = byId(db.stages, stageId);
  db.reviews.push({ id: nid(db, 'r'), stage: t.id, exec: t.exec, author: authorId, score, text, date: today(), ref: byId(db.orders, t.order).num });
  const mine = db.reviews.filter((r) => r.exec === t.exec);
  const avg = mine.reduce((a, r) => a + r.score, 0) / mine.length;
  notify(db, mastersOf(db, t.exec), `Етап «${svcName(db, t.service)}» (${byId(db.orders, t.order).num}) оцінено: ${'★'.repeat(score)}`, '/my-reviews');
  return { msg: `Відгук збережено. Рейтинг «${byId(db.parties, t.exec).name}»: ${avg.toFixed(1)}` };
}

/* ───────── Довідники ───────── */
export function addParty(db, values) {
  db.parties.push({ id: nid(db, 'p'), rating: null, ...values });
  return { msg: values.type === 'client' ? 'Контрагента додано' : 'Виконавця додано. Відкрийте його картку, щоб вказати послуги й ціни.' };
}
export function addService(db, { name, cat }) {
  db.services.push({ id: nid(db, 's'), name, cat: cat || 'Інше' });
  return { msg: 'Послугу додано' };
}
export function addOffer(db, { partyId, serviceId, price, days }) {
  if (db.offers.some((x) => x.p === partyId && x.s === serviceId)) throw new Error('Ця послуга вже є у виконавця');
  db.offers.push({ p: partyId, s: serviceId, price, days });
  return { msg: 'Послугу додано. Тепер виконавець є в підборі.' };
}
export function deleteOffer(db, { partyId, serviceId }) {
  db.offers = db.offers.filter((x) => !(x.p === partyId && x.s === serviceId));
  return { msg: 'Послугу прибрано' };
}

/* ───────── Користувачі (адміністратор) ───────── */
export function addUser(db, { name, login, role, party }) {
  if (db.users.some((u) => u.login === login)) throw new Error('Такий логін уже є');
  db.users.push({ id: nid(db, 'u'), name, login, role, party: role === 'master' ? party : null });
  return { msg: 'Обліковий запис створено' };
}
export function setUserRole(db, { userId, role }) {
  const u = byId(db.users, userId);
  u.role = role;
  if (role !== 'master') u.party = null; else if (!u.party) u.party = 'p1';
  return { msg: 'Роль змінено' };
}
export function deleteUser(db, { userId }) {
  db.users = db.users.filter((u) => u.id !== userId);
  return { msg: 'Користувача видалено' };
}

/* ───────── Робота зі сповіщеннями ───────── */
export function markNotificationRead(db, { id }) {
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.read = true;
}
export function markAllNotificationsRead(db, { userId }) {
  db.notifications.forEach((n) => { if (n.user === userId) n.read = true; });
}
