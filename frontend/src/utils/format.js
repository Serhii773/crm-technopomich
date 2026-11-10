export const money = (n) => (n || 0).toLocaleString('uk-UA') + ' грн';
export const today = () => new Date().toISOString().slice(0, 10);
export const fmtDate = (d) => (d ? d.split('-').reverse().join('.') : '—');
export const shortDate = (d) => (d ? d.slice(8, 10) + '.' + d.slice(5, 7) : '');
export const devLabel = (d) => {
  if (!d) return '—';
  const m = [d.brand, d.model].filter((x) => x && x !== '—').join(' ');
  return m || 'модель не вказана';
};

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
export const monthLabel = (ym) => MONTHS[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4);
