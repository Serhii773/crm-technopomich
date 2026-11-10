import { DEVICE_FIELDS, DEVTYPES } from '../utils/constants.js';
import Field from './Field.jsx';

export default function DeviceFields({ f, names, withNote }) {
  const type = f.values[names.type];
  const cfg = DEVICE_FIELDS[type];
  return (
    <div className="form">
      <div className="row">
        <Field label="Тип пристрою"><select {...f.bind(names.type)}>{DEVTYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        {cfg.brand === true && <Field label="Бренд (якщо відомо)"><input {...f.bind(names.brand)} placeholder="Lenovo, ASUS, HP…" /></Field>}
        <Field label={cfg.modelLabel}><input {...f.bind(names.model)} /></Field>
        {cfg.sn && <Field label="Серійний номер (якщо відомо)"><input {...f.bind(names.sn)} /></Field>}
      </div>
      {withNote && <Field label="Зовнішній стан і комплектація"><input {...f.bind(names.note)} placeholder="Напр.: тріщина на екрані, є зарядка, без сумки" /></Field>}
    </div>
  );
}
