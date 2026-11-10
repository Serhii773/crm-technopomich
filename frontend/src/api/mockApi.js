/**
 * Мок-сервер REST API (завдання дозволяє «фейковий або реальний REST API / mock-сервер»).
 *
 * «Сервер» зберігає базу в localStorage (її видно лише у цьому браузері) і відповідає
 * асинхронно з невеликою затримкою — як справжній HTTP-сервіс. Компоненти не знають,
 * що всередині: вони викликають getDb() і mutate(операція, дані). Щоб підключити
 * реальний backend, достатньо замінити тіло request() на fetch(...).
 *
 * Помилки (наприклад, «Такий логін уже є») кидаються як Error — інтерфейс показує їх у toast.
 */
import { seed } from './seed.js';

const KEY = 'technopomich-crm-react-v1';
export const STORAGE_KEY = KEY; // ключ, за яким інші вкладки дізнаються про зміни
const LATENCY = 250; // мс — імітація мережевої затримки

const delay = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms));

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (!db.notifications) db.notifications = []; // міграція: старі збережені бази без сповіщень
      return db;
    }
  } catch { /* пошкоджені дані — починаємо з демо */ }
  return seed();
}
function write(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* сховище недоступне */ }
}

/** GET /db — отримати всі дані */
export async function getDb() {
  await delay();
  return read();
}

/**
 * POST/PATCH/DELETE — виконати операцію зміни.
 * op(db, payload) змінює копію бази й може повернути результат {msg, ...}.
 */
export async function mutate(op, payload) {
  await delay();
  const db = read();
  const result = op(db, payload) || {};
  write(db);
  return { db, result };
}

/** POST /login — перевірка логіна й пароля (демо-пароль для всіх: demo) */
export async function login(loginName, password) {
  await delay(150);
  const db = read();
  const user = db.users.find((u) => u.login === loginName.trim());
  if (!user || password !== 'demo') throw new Error('Невірний логін або пароль. Пароль для демо: demo');
  return user.id;
}

/** Скинути демо-дані до початкових */
export function resetDb() {
  localStorage.removeItem(KEY);
}
