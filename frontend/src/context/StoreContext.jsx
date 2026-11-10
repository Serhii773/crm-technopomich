import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/client.js';
import { makeSel } from '../utils/selectors.js';

const StoreContext = createContext(null);
const SESSION_KEY = 'technopomich-session';

export function StoreProvider({ children }) {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState(null);
  const [userId, setUserId] = useState(() => {
    try { return api.getToken() ? localStorage.getItem(SESSION_KEY) : null; } catch { return null; }
  });
  const timer = useRef();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setDb(await api.getDb()); } // GET /db
    catch (e) { setError(e.message || 'Не вдалося завантажити дані'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const sync = async () => { try { setDb(await api.getDb()); } catch { /* ignore */ } };
    const onStorage = (e) => { if (e.key === api.STORAGE_KEY) sync(); };
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const notify = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const run = useCallback(async (op, payload) => {
    setPending(true);
    try {
      const { db: next, result } = await api.mutate(op, payload); // POST / PATCH / DELETE
      setDb(next);
      if (result.msg) notify(result.msg);
      return result;
    } catch (e) {
      notify(e.message || 'Помилка запиту', 'err');
      return null;
    } finally { setPending(false); }
  }, [notify]);

  const signIn = async (login, password) => {
    const id = await api.login(login, password); // кидає помилку при невірних даних; зберігає JWT
    const fresh = await api.getDb();               // тепер знімок БД повний (із токеном)
    try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
    setDb(fresh);
    setUserId(id);
    return fresh.users.find((u) => u.id === id);
  };
  const signOut = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    api.setToken(null);
    setUserId(null);
    api.getDb().then(setDb).catch(() => {}); // знову лише публічні дані
  };
  const resetDemo = async () => { await api.resetDb(); signOut(); load(); };

  const sel = useMemo(() => (db ? makeSel(db) : null), [db]);
  const user = db && userId ? db.users.find((u) => u.id === userId) || null : null;

  const value = { db, sel, user, loading, error, pending, toast, load, run, notify, signIn, signOut, resetDemo };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
