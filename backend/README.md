# ТехноПоміч CRM — backend (C# / ASP.NET Core, .NET 10)

REST API: ASP.NET Core Web API, PostgreSQL (Npgsql + Dapper), JWT-автентифікація (BCrypt),
ролі (admin, manager, head, master), валідація DataAnnotations, централізована обробка помилок.
API підлаштовано під фронтенд з лабораторної № 6-7 (React + Vite): ті самі маршрути та формат даних.

## Вимоги
.NET SDK 10, PostgreSQL 14+

## Запуск
1. Створіть порожню БД `crm` (pgAdmin або `createdb crm`).
2. У `appsettings.json` вкажіть пароль у `ConnectionStrings:Default` і змініть `Jwt:Key` (≥ 32 символи).
3. `dotnet restore`
4. `dotnet run -- --seed` — створює таблиці й демо-дані (пароль усіх користувачів: `demo`).
5. `dotnet run` — API на http://localhost:5000/api
6. Запити для перевірки — у файлі `crm.http`.
7. Фронтенд: у його папці `npm install`, `npm run dev` (Vite проксує `/api` на :5000).

Користувачі: admin (адмін), oksana (менеджер), roman (керівник), andrii / iryna / taras / oleh / maksym (майстри).

## Формат
- Вхід: `POST /api/login {login,password}` → `{userId, token, user}`; далі `Authorization: Bearer <token>`.
- `GET /api/db` — знімок усіх даних (без токена — лише публічна частина).
- Операції зміни повертають `{ db, result }`.
- Помилки: `{ "status": 404, "message": "..." }`, для 400 додається `details: [{field,message}]`.
