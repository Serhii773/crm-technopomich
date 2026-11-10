/** Довідники та константи предметної області (відповідають CHECK-обмеженням БД з ЛР №5) */
export const DIAG = 's1'; // id послуги «Діагностика» — перший етап кожного замовлення
export const DEVTYPES = ['Ноутбук', 'MacBook', 'ПК', 'Моноблок', 'iMac', 'Інше'];
export const ROLES = { admin: 'Адміністратор', manager: 'Менеджер', head: 'Керівник', master: 'Майстер' };
export const PTYPE = { client: 'Замовник', exec: 'Виконавець', both: 'Замовник і виконавець' };
export const STAGE = { wait: ['Очікує', 'c-idle'], asg: ['Призначено', 'c-info'], run: ['Виконується', 'c-warn'], done: ['Завершено', 'c-ok'] };
export const ORDER = { new: ['Нове', 'c-idle'], work: ['У процесі', 'c-warn'], done: ['Виконане', 'c-ok'], cancel: ['Скасоване', 'c-bad'] };

export const NAV = {
  manager: [['/orders', 'Замовлення'], ['/orders/new', 'Нове замовлення'], ['/parties', 'Контрагенти'], ['/services', 'Послуги']],
  master: [['/my-stages', 'Мої етапи'], ['/my-reviews', 'Мої відгуки'], ['/my-services', 'Мої послуги']],
  head: [['/stats', 'Статистика'], ['/orders', 'Замовлення']],
  admin: [['/users', 'Користувачі']],
};

export const DEVICE_FIELDS = {
  'Ноутбук': { brand: true, modelLabel: 'Модель (якщо відомо)', sn: true },
  'MacBook': { brand: 'Apple', modelLabel: 'Модель (напр., Air M1, 2020)', sn: true },
  'Моноблок': { brand: true, modelLabel: 'Модель (якщо відомо)', sn: true },
  'iMac': { brand: 'Apple', modelLabel: 'Модель (напр., 24", 2021)', sn: true },
  'ПК': { brand: false, modelLabel: 'Модель або конфігурація (напр., HP ProDesk 400 або Ryzen 5 / 16 ГБ)', sn: false },
  'Інше': { brand: false, modelLabel: 'Що це за пристрій (назва, модель)', sn: false },
};
