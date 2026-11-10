import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { createOrder } from '../api/operations.js';
import { DEVTYPES } from '../utils/constants.js';
import { devLabel } from '../utils/format.js';
import useFormState from '../hooks/useFormState.js';
import { email, phone, required, validate } from '../utils/validation.js';
import Field from '../components/Field.jsx';
import DeviceFields from '../components/DeviceFields.jsx';
import { normalizeDevice } from '../utils/device.js';

export default function NewOrderPage() {
  const { db, user, run, pending } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const clients = db.parties.filter((p) => p.type !== 'exec');

  const f = useFormState({
    client: params.get('client') || clients[0].id, device: '',
    cName: '', cPhone: '', cEmail: '',
    dType: DEVTYPES[0], dBrand: '', dModel: '', dSn: '', dNote: '', desc: '',
  });
  const v = f.values;
  const isNewClient = v.client === '__new';
  const devs = isNewClient ? [] : db.devices.filter((d) => d.owner === v.client);
  const device = v.device && (v.device === '__new' || devs.some((d) => d.id === v.device)) ? v.device : devs[0]?.id || '__new';
  const isNewDevice = device === '__new';

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(v, {
      desc: [(x) => required(x, 'Опишіть несправність')],
      ...(isNewClient ? { cName: [(x) => required(x, 'Вкажіть ПІБ або назву клієнта')], cPhone: [phone], cEmail: [email] } : {}),
    });
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await run(createOrder, {
      clientId: isNewClient ? null : v.client,
      newClient: isNewClient ? { name: v.cName.trim(), phone: v.cPhone.trim(), email: v.cEmail.trim() } : null,
      deviceId: isNewDevice ? null : device,
      newDevice: isNewDevice ? normalizeDevice({ type: v.dType, brand: v.dBrand, model: v.dModel, sn: v.dSn, note: v.dNote }) : null,
      desc: v.desc.trim(), managerId: user.id,
    });
    if (res) navigate(`/orders/${res.orderId}`);
  };

  return (
    <>
      <div className="head"><div><div className="crumb"><Link to="/orders">Замовлення</Link> / нове</div><h1>Нове замовлення</h1></div></div>
      <form className="panel form" onSubmit={submit} noValidate>
        <div className="row">
          <Field label="Клієнт">
            <select {...f.bind('client')} onChange={(e) => f.setValues((x) => ({ ...x, client: e.target.value, device: '' }))}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new">+ Новий клієнт…</option>
            </select>
          </Field>
          <Field label="Пристрій">
            <select name="device" value={device} onChange={(e) => f.setValues((x) => ({ ...x, device: e.target.value }))}>
              {devs.map((d) => <option key={d.id} value={d.id}>{d.type} · {devLabel(d)}</option>)}
              <option value="__new">+ Новий пристрій…</option>
            </select>
          </Field>
        </div>

        {isNewClient && (
          <>
            <div className="row">
              <Field label="ПІБ або назва клієнта" error={f.errors.cName}><input {...f.bind('cName')} placeholder="Ганна Іванівна Ткачук" /></Field>
              <Field label="Телефон (необов'язково)" error={f.errors.cPhone}><input {...f.bind('cPhone')} placeholder="+380" /></Field>
              <Field label="Інший контакт (необов'язково)" error={f.errors.cEmail}><input {...f.bind('cEmail')} placeholder="email" /></Field>
            </div>
          </>
        )}

        {isNewDevice && <DeviceFields f={f} names={{ type: 'dType', brand: 'dBrand', model: 'dModel', sn: 'dSn', note: 'dNote' }} withNote />}

        <Field label="Опис несправності" error={f.errors.desc}>
          <textarea {...f.bind('desc')} placeholder="Що сталося, що бачить клієнт" />
        </Field>
        <div className="actions">
          <button className="btn pri" type="submit" disabled={pending}>{pending ? 'Створення…' : 'Створити замовлення'}</button>
          <Link className="btn" to="/orders">Скасувати</Link>
        </div>
      </form>
    </>
  );
}
