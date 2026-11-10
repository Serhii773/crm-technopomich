export const required = (v, msg = 'Обов’язкове поле') => (String(v ?? '').trim() ? '' : msg);
export const phone = (v) => {
  if (!v) return '';
  const digits = v.replace(/\D/g, '').length;
  const ok = /^\+?[\d\s()-]+$/.test(v.trim()) && digits >= 9 && digits <= 15;
  return ok ? '' : 'Телефон: 9–15 цифр, можна +, пробіли, дужки та дефіс (напр. +380 67 123 45 67)';
};
export const email = (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Невірний формат email, наприклад: name@example.com');
export const login = (v) => (/^[a-z0-9._-]+$/.test(v) ? '' : 'Лише латинські літери, цифри, крапка, дефіс');
export const minNumber = (min, msg) => (v) => (v !== '' && Number(v) >= min ? '' : msg);

export function validate(values, rules) {
  const errors = {};
  for (const [field, fns] of Object.entries(rules)) {
    for (const fn of fns) {
      const e = fn(values[field]);
      if (e) { errors[field] = e; break; }
    }
  }
  return errors;
}
