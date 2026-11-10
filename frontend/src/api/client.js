/**
 * HTTP-клієнт фронтенду: усі звернення до сервера робляться через fetch.
 * Стан завантаження й помилки обробляє StoreContext (loading / error / toast).
 */
import * as operations from './operations.js';
import { ROUTES } from './routes.js';

export const STORAGE_KEY = 'technopomich-crm-react-v1'; // за цим ключем інші вкладки дізнаються про зміни
const TOKEN_KEY = 'technopomich-token';                // JWT, виданий бекендом після входу

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

// Сторінки передають у run() саму функцію-операцію; тут за нею знаходимо її REST-маршрут.
const NAME_OF = new Map(Object.entries(operations).map(([name, fn]) => [fn, name]));

/** Базовий запит: JSON у тілі, розбір відповіді, помилки мережі й HTTP-статусів. */
async function request(method, path, body) {
  let res;
  try {
    const token = getToken();
    res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Немає зв’язку із сервером. Спробуйте ще раз.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && getToken() && path !== '/login') {
    // токен недійсний або прострочений — завершуємо сеанс
    setToken(null);
    try { localStorage.removeItem('technopomich-session'); } catch { /* ignore */ }
    window.location.reload();
  }
  if (!res.ok) throw new Error(data.message || data.error || `Помилка сервера (${res.status})`);
  return data;
}

/** GET /api/db — отримати всі дані */
export const getDb = () => request('GET', '/db');

/** POST / PATCH / DELETE — виконати операцію зміни; повертає { db, result } */
export function mutate(op, payload) {
  const [method, path] = ROUTES[NAME_OF.get(op)];
  return request(method, path, payload);
}

/** POST /api/login — зберігає JWT і повертає id користувача або кидає помилку (демо-пароль: demo) */
export async function login(loginName, password) {
  setToken(null);
  const { userId, token } = await request('POST', '/login', { login: loginName, password });
  setToken(token);
  return userId;
}

/** DELETE /api/db — скинути демо-дані */
export const resetDb = () => request('DELETE', '/db');
