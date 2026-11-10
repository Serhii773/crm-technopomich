import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { markAllNotificationsRead, markNotificationRead } from '../api/operations.js';
import { fmtDate } from '../utils/format.js';

export default function NotificationsBell() {
  const { db, user, run } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  // найновіші зверху
  const list = db.notifications.filter((n) => n.user === user.id).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id, undefined, { numeric: true }));
  const unread = list.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const openItem = (n) => {
    if (!n.read) run(markNotificationRead, { id: n.id });
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={box} className="bell-wrap">
      <button className="bell" aria-label={`Сповіщення${unread ? `, непрочитаних: ${unread}` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && <span className="badge bell-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Сповіщення">
          <div className="notif-head">
            <b>Сповіщення</b>
            {unread > 0 && <button className="btn sm ghost" onClick={() => run(markAllNotificationsRead, { userId: user.id })}>Позначити всі прочитаними</button>}
          </div>
          {list.length ? list.map((n) => (
            <button key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => openItem(n)}>
              <span>{n.text}</span>
              <span className="d">{fmtDate(n.date)}{n.read ? '' : ' · нове'}</span>
            </button>
          )) : <div className="empty">Сповіщень ще немає</div>}
        </div>
      )}
    </div>
  );
}
