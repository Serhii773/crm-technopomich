export default function Progress({ stages }) {
  if (!stages.length) return <span className="mute">немає етапів</span>;
  const cls = { done: 'done', run: 'run', asg: 'asg' };
  const doneCount = stages.filter((t) => t.status === 'done').length;
  return (
    <div className="prog" title={`${doneCount} з ${stages.length} етапів завершено`}>
      {stages.map((t) => <span key={t.id} className={cls[t.status] || ''} />)}
    </div>
  );
}
