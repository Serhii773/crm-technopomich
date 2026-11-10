import { DEVICE_FIELDS } from './constants.js';

export function normalizeDevice({ type, brand, model, sn, note }) {
  const cfg = DEVICE_FIELDS[type];
  return {
    type,
    brand: typeof cfg.brand === 'string' ? cfg.brand : cfg.brand ? brand.trim() : '',
    model: model.trim(),
    sn: cfg.sn ? sn.trim() : '',
    ...(note !== undefined ? { note: note.trim() } : {}),
  };
}

export function deviceToForm(d) {
  const cfg = DEVICE_FIELDS[d.type] || DEVICE_FIELDS['Інше'];
  const clean = (x) => (x && x !== '—' ? x : '');
  const brand = clean(d.brand), model = clean(d.model);
  return cfg.brand === true
    ? { brand, model, sn: clean(d.sn) }
    : { brand: '', model: cfg.brand ? model : [brand, model].filter(Boolean).join(' '), sn: clean(d.sn) };
}
