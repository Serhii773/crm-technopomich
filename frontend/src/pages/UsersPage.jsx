import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { addUser, deleteUser, setUserRole } from '../api/operations.js';
import { ROLES } from '../utils/constants.js';
import useFormState from '../hooks/useFormState.js';
import { login as loginRule, required, validate } from '../utils/validation.js';
import Field from '../components/Field.jsx';

/** Адміністратор: облікові записи, ролі, створення й видалення. */
export default function UsersPage() {
  const { db, sel, user: me, run, pending } = useStore();
  const [armed, setArmed] = useState(null); // id користувача, видалення якого очікує підтвердження
  const execs = db.parties.filter((p) => p.type !== 'client');
  const f = useFormState({ name: '', login: '', role: 'manager', party: execs[0]?.id });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f.values, { name: [(x) => required(x, 'Вкажіть ім’я')], login: [(x) => required(x, 'Вкажіть логін'), loginRule] });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(addUser, { name: f.values.name.trim(), login: f.values.login.trim(), role: f.values.role, party: f.values.party }); // POST /users
    if (res) f.reset();
  };

  return (
    <>
      <div className="head"><div><div className="crumb">Доступ до системи</div><h1>Користувачі</h1></div></div>
      <div className="panel"><div className="tbl-wrap"><table>
        <thead><tr><th>Ім'я</th><th>Логін</th><th>Роль</th><th>Представляє</th><th /></tr></thead>
        <tbody>
          {db.users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td className="mono">{u.login}</td>
              <td>
                <select aria-label={`Роль ${u.name}`} value={u.role} disabled={u.id === me.id || pending}
                  onChange={(e) => run(setUserRole, { userId: u.id, role: e.target.value })}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </td>
              <td>{u.party ? sel.party(u.party).name : <span className="mute">—</span>}</td>
              <td className="r">{u.id !== me.id && (
                <button className="btn sm ghost bad" disabled={pending}
                  onClick={() => (armed === u.id ? run(deleteUser, { userId: u.id }).then(() => setArmed(null)) : setArmed(u.id))}>
                  {armed === u.id ? 'Точно?' : 'Видалити'}
                </button>
              )}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      <form className="panel form" onSubmit={submit} noValidate>
        <h2>Створити обліковий запис</h2>
        <div className="row">
          <Field label="Ім'я" error={f.errors.name}><input {...f.bind('name')} /></Field>
          <Field label="Логін" error={f.errors.login}><input {...f.bind('login')} /></Field>
          <Field label="Роль"><select {...f.bind('role')}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        {f.values.role === 'master' && (
          <div className="row"><Field label="Виконавець, якого представляє майстер"><select {...f.bind('party')}>{execs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field></div>
        )}
        <div><button className="btn pri" type="submit" disabled={pending}>Створити</button></div>
        <p className="note" style={{ margin: 0 }}>Самостійної реєстрації немає: лише адміністратор створює облікові записи. Тимчасовий пароль: demo.</p>
      </form>
    </>
  );
}
