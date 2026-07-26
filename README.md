# Kova

Сучасний мінімалістичний workspace для фрилансерів: проєкти, бюджети та
задачі в одному особистому кабінеті.

**Live demo:** [www.kova-work.com](https://www.kova-work.com)

## Можливості

- адаптивний landing page із плавними CSS-анімаціями;
- реєстрація через email і пароль із шестизначним кодом підтвердження;
- вхід через Google Identity Services і ChatGPT;
- PBKDF2-хешування паролів і захищені HttpOnly-сесії;
- обмеження спроб входу та перевірки same-origin запитів;
- персональні проєкти, бюджети, дедлайни й задачі;
- створення, редагування та видалення проєктів;
- ізоляція даних кожного користувача на сервері;
- постійне зберігання даних у Cloudflare D1;
- transactional email через Resend;
- CSP, HSTS та інші browser security headers.

## Технології

- React 19, TypeScript, Vinext;
- Cloudflare Workers і D1;
- Drizzle ORM;
- Google Identity Services;
- Resend Email API;
- CSS без UI-фреймворків.

## Локальний запуск

Потрібен Node.js 22.13 або новіший.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Для macOS або Linux заміни `copy` на `cp`.

Змінні середовища:

```text
GOOGLE_CLIENT_ID
RESEND_API_KEY
EMAIL_FROM
```

Справжні ключі не повинні потрапляти в Git. Для продакшну вони зберігаються як
захищені змінні середовища хостингу.

## Перевірки

```bash
npm run typecheck
npm run build
npm test
```

## Архітектура безпеки

Google ID token перевіряється на сервері за публічними ключами Google. Паролі
ніколи не зберігаються відкритим текстом. Коди підтвердження діють 10 хвилин,
у базі зберігається лише їхній SHA-256 хеш, а кількість невдалих спроб
обмежена.
