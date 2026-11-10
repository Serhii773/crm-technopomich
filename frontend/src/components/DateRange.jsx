import { fmtDate, shortDate, today } from '../utils/format.js';

export default function DateRange({ t }) {
  if (!t.exec || !t.due) return <span className="mute">—</span>;
  const late = t.doneAt && t.doneAt > t.due;
  return (
    <>
      <span className="num">{shortDate(t.start)} → {shortDate(t.due)}</span>
      {t.status === 'done' && t.doneAt && (
        <div style={{ fontSize: 12 }} className={late ? '' : 'mute'}>
          {late ? <span style={{ color: 'var(--bad)' }}>завершено {fmtDate(t.doneAt)}, із запізненням</span> : `завершено ${fmtDate(t.doneAt)}`}
        </div>
      )}
      {t.status !== 'done' && t.due < today() && <div style={{ fontSize: 12, color: 'var(--bad)' }}>прострочено</div>}
    </>
  );
}
