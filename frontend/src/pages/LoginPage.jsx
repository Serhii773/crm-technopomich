import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { NAV, ROLES } from '../utils/constants.js';
import useFormState from '../hooks/useFormState.js';
import { required, validate } from '../utils/validation.js';
import Field from '../components/Field.jsx';
import Toast from '../components/Toast.jsx';

export default function LoginPage() {
  const { db, sel, user, signIn, notify } = useStore();
  const navigate = useNavigate();
  const form = useFormState({ login: 'oksana', password: 'demo' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={NAV[user.role][0][0]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form.values, { login: [required], password: [required] });
    form.setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const u = await signIn(form.values.login, form.values.password); // POST /login
      navigate(NAV[u.role][0][0]);
    } catch (err) {
      notify(err.message, 'err');
    } finally { setBusy(false); }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="brand"><span className="brand-mark">ТП</span>ТехноПоміч CRM</div>
        <div className="users" role="group" aria-label="Демо-користувачі">
          {db.users.map((u) => (
            <button key={u.id} type="button" className="user-opt" aria-pressed={u.login === form.values.login}
              onClick={() => form.setValues((v) => ({ ...v, login: u.login }))}>
              <span>{u.name}<br /><span className="mute mono" style={{ fontSize: 12 }}>{u.login}</span></span>
              <span className="role-tag">{ROLES[u.role]}{u.party && <><br />{sel.party(u.party).name}</>}</span>
            </button>
          ))}
        </div>
        <div className="row">
          <Field label="Логін" error={form.errors.login}><input {...form.bind('login')} autoComplete="username" /></Field>
          <Field label="Пароль" error={form.errors.password}><input {...form.bind('password')} type="password" autoComplete="current-password" /></Field>
        </div>
        <button className="btn pri" type="submit" disabled={busy}>{busy ? 'Вхід…' : 'Увійти'}</button>
      </form>
      <Toast />
    </div>
  );
}
