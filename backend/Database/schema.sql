-- Схема бази даних «ТехноПоміч CRM» (PostgreSQL). Розвиток моделі з лабораторної роботи № 5.
DROP TABLE IF EXISTS notifications, reviews, interactions, order_stages, orders, devices, executor_services,
  services, users, roles, counterparties,
  stages, offers, parties CASCADE; -- stages, offers, parties — назви з попередньої версії
DROP SEQUENCE IF EXISTS order_num_seq;

-- Контрагенти: замовники (client), виконавці (exec) і обидва ролі (both)
CREATE TABLE counterparties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('client', 'exec', 'both')),
  phone VARCHAR(30) NOT NULL DEFAULT '',
  email VARCHAR(150) NOT NULL DEFAULT '',
  addr VARCHAR(300) NOT NULL DEFAULT '',
  rating NUMERIC(3,2) CHECK (rating BETWEEN 0 AND 5)
);

-- Довідник ролей
CREATE TABLE roles (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Облікові записи: admin, manager, head, master (майстер прив'язаний до виконавця)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  login VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL REFERENCES roles(code),
  party_id INTEGER REFERENCES counterparties(id) ON DELETE SET NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  cat VARCHAR(100) NOT NULL DEFAULT 'Інше'
);

-- Прайс виконавця: послуга, ціна, термін у днях
CREATE TABLE executor_services (
  party_id INTEGER NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  days INTEGER NOT NULL CHECK (days >= 1),
  PRIMARY KEY (party_id, service_id)
);

CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES counterparties(id),
  type VARCHAR(30) NOT NULL,
  brand VARCHAR(100) NOT NULL DEFAULT '',
  model VARCHAR(150) NOT NULL DEFAULT '',
  sn VARCHAR(100) NOT NULL DEFAULT '',
  note VARCHAR(500)
);

CREATE SEQUENCE order_num_seq START 1045;

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  num VARCHAR(20) UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES counterparties(id),
  device_id INTEGER NOT NULL REFERENCES devices(id),
  description TEXT NOT NULL,
  created_on DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(10) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'work', 'done', 'cancel')),
  manager_id INTEGER NOT NULL REFERENCES users(id)
);

-- Етапи замовлення: послуга, виконавець, статус, ціна, терміни, висновок і пропозиція виконавця
CREATE TABLE order_stages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  n INTEGER NOT NULL CHECK (n >= 1),
  service_id INTEGER NOT NULL REFERENCES services(id),
  exec_id INTEGER REFERENCES counterparties(id),
  status VARCHAR(10) NOT NULL DEFAULT 'wait' CHECK (status IN ('wait', 'asg', 'run', 'done')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  start_date DATE,
  due_date DATE,
  done_at DATE,
  concl TEXT,
  price_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  proposal_price NUMERIC(10,2),
  proposal_text TEXT,
  proposal_date DATE,
  reply TEXT
);

CREATE TABLE interactions (
  id SERIAL PRIMARY KEY,
  party_id INTEGER NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
  order_num VARCHAR(20),
  on_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(30) NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER REFERENCES order_stages(id) ON DELETE SET NULL,
  exec_id INTEGER NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  text TEXT NOT NULL DEFAULT '',
  on_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ref VARCHAR(20)
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  link VARCHAR(100),
  on_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX ix_stages_order ON order_stages(order_id);
CREATE INDEX ix_stages_exec ON order_stages(exec_id);
CREATE INDEX ix_notifications_user ON notifications(user_id);
