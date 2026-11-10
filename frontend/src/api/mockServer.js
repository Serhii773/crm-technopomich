/**
 * Мок-сервер REST API на базі MSW (Mock Service Worker).
 * Завдання дозволяє «фейковий або реальний REST API / mock-сервер».
 *
 * Фронтенд робить звичайні HTTP-запити через fetch('/api/...'). Service Worker від MSW
 * перехоплює їх у браузері й повертає імітовані HTTP-відповіді (JSON і статуси 200/400/401),
 * тож запити видно у вкладці Network інструментів розробника. Це не віддалений сервер,
 * а навчальний mock: база зберігається в localStorage. Щоб підключити реальний backend,
 * достатньо не запускати startMockServer() у main.jsx — ті самі fetch підуть на справжній сервер.
 */
import { http, HttpResponse, delay as mswDelay } from 'msw';
import { setupWorker } from 'msw/browser';
import { seed } from './seed.js';
import * as operations from './operations.js';
import { ROUTES } from './routes.js';

const KEY = 'technopomich-crm-react-v1';
export const STORAGE_KEY = KEY; // ключ, за яким інші вкладки дізнаються про зміни
const LATENCY = 250; // мс — імітація мережевої затримки


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

const body = (request) => request.json().catch(() => ({}));
const fail = (status, error) => HttpResponse.json({ error }, { status });

/** Обробники маршрутів: GET/DELETE /api/db, POST /api/login і всі операції зі списку ROUTES. */
const handlers = [
  http.get('/api/db', async () => { await mswDelay(LATENCY); return HttpResponse.json(read()); }),
  http.delete('/api/db', async () => { localStorage.removeItem(KEY); return HttpResponse.json({ ok: true }); }),

  http.post('/api/login', async ({ request }) => {
    await mswDelay(150);
    const b = await body(request);
    const user = read().users.find((u) => u.login === String(b.login || '').trim());
    if (!user || b.password !== 'demo') return fail(401, 'Невірний логін або пароль. Пароль для демо: demo');
    return HttpResponse.json({ userId: user.id });
  }),

  // операції зміни даних: метод і адреса беруться з таблиці ROUTES
  ...Object.entries(ROUTES).map(([name, [method, path]]) =>
    http[method.toLowerCase()]('/api' + path, async ({ request }) => {
      await mswDelay(LATENCY);
      try {
        const db = read();
        const result = operations[name](db, await body(request)) || {};
        write(db);
        return HttpResponse.json({ db, result });
      } catch (e) {
        return fail(400, e.message || 'Помилка запиту'); // наприклад, «Такий логін уже є»
      }
    })),
];

/** Запускає Service Worker. Запити поза /api/ проходять у мережу без змін. */
export function startMockServer() {
  return setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true });
}
