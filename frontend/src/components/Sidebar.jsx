import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { NAV, ROLES } from '../utils/constants.js';
import NotificationsBell from './NotificationsBell.jsx';

export default function Sidebar() {
  const { user, db, sel, signOut } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pending = user.role === 'master' ? db.stages.filter((t) => t.exec === user.party && t.status === 'asg').length : 0;

  const isActive = (to) => {
    if (to === '/orders') return pathname === '/orders' || (pathname.startsWith('/orders/') && pathname !== '/orders/new');
    return pathname === to || (to === '/parties' && pathname.startsWith('/parties/'));
  };

  return (
    <aside className="rail">
      <div className="brand-row">
        <div className="brand"><span className="brand-mark">ТП</span>ТехноПоміч</div>
        {(user.role === 'manager' || user.role === 'master') && <NotificationsBell />}
      </div>
      <nav aria-label="Розділи">
        {NAV[user.role].map(([to, label]) => (
          <Link key={to} to={to} className="nav-btn" aria-current={isActive(to) ? 'page' : undefined}>
            <span>{label}</span>
            {to === '/my-stages' && pending > 0 && <span className="badge" aria-label="нових">{pending}</span>}
          </Link>
        ))}
      </nav>
      <div className="me">
        <div>
          <div>{user.name}</div>
          <div className="role-tag">{ROLES[user.role]}{user.party ? ' · ' + sel.party(user.party).name : ''}</div>
        </div>
        <button className="btn sm ghost" onClick={() => { signOut(); navigate('/login'); }}>Вийти</button>
      </div>
    </aside>
  );
}
