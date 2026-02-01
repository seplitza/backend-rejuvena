# Точка восстановления: 1 февраля 2026 - Версия 1.2.1

## Статус на момент создания
- **Дата:** 1 февраля 2026, 13:45
- **Backend версия:** 1.2.0
- **Frontend версия:** 1.1.0
- **Продакшн бэкенд:** http://37.252.20.170:9527 ✅ Работает
- **Frontend:** https://seplitza.github.io/rejuvena/ ✅ Развернут

## Последние коммиты

### Backend (0619d4b)
```
0619d4b Fix: Add POST /callback alias for Alfabank webhook compatibility
6365b72 Fix: Add expiresAt calculation to activateMarathon
d235b7b Fix: Extract userId._id from populated payment object
91377e2 Add logging to admin payment status change endpoint
6f96583 Fix GitHub Actions: Pull latest code from git before deploy
b3cd39b Fix photo diary: +90 days for marathon purchase
d116f32 Clean: Remove debug logging from create-marathon endpoint
955261b Debug: Add logging to create-marathon endpoint
9693212 Clean: Remove debug logging from my-enrollments endpoint
cadae89 Fix: Add backward compatibility for old marathon payment metadata
```

### Frontend (7798dba)
```
7798dba Fix: Use HTTPS API URL for GitHub Pages (mixed content fix)
0b8b132 Fix TypeScript: Add 'type' to Payment interface metadata
e003a51 Fix photo diary calculation for marathon purchases
e3702c0 Clean: Remove backup files
cae09d7 Fix: OffersGrid uses correct marathon payment endpoint
055f33b chore: force rebuild
2581792 chore: force redeploy to GitHub Pages
c05805a feat: add telegramUsername field to signup, profile settings
fd61a95 fix: correct marathon/premium block detection using planType
2875c66 feat: update marathon payment success page with tenure, photo diary
```

## Ключевые возможности системы

### 1. Марафоны
- ✅ Создание марафонов через админку
- ✅ Оплата марафонов через Альфабанк
- ✅ Автоматическая запись пользователей при оплате
- ✅ Email уведомления (Resend): welcome, daily reminders, completion
- ✅ PM2 cron job для ежедневных напоминаний (9:00)
- ✅ Страница успешной оплаты с деталями марафона
- ✅ Фильтрация купленных марафонов из слайдера
- ✅ Страница старта марафона с обратным отсчетом
- ✅ Поддержка телеграм username в профиле

### 2. Платежная система
- ✅ Интеграция с Альфабанк (продакшн ключи)
- ✅ Премиум подписка (+30 дней)
- ✅ Оплата марафонов
- ✅ Дневник фото: 30 базовых + 90 за марафон
- ✅ История платежей (кликабельная, фильтруемая)
- ✅ Админ панель: управление заказами, ручная активация

### 3. Backend API
- **Порт:** 9527
- **База:** MongoDB (localhost:27017/rejuvena)
- **Email:** Resend (re_rj675j5x_DELv28yV2qGtTK5Dwzs6B872)
- **PM2 процессы:**
  - `rejuvena-backend` - основной API
  - `marathon-notifier` - cron job для email (9:00 daily)

### 4. Frontend
- **Framework:** Next.js 14.2.33 (static export)
- **Deploy:** GitHub Pages
- **API:** https://37.252.20.170:9527 (CORS настроен)
- **Auth:** JWT token в localStorage

## Развертывание

### Backend (автодеплой через GitHub Actions)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git add . && git commit -m "..." && git push
# GitHub Actions auto-deploys → VPS pulls → rebuilds → PM2 restart
```

### Frontend (автодеплой через GitHub Actions)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git add . && git commit -m "..." && git push
# GitHub Actions builds → deploys to GitHub Pages
```

### Ручной деплой (если нужно)
```bash
# Backend
ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && git pull && npm install && npm run build && cd admin-panel && npm install && npm run build && cd .. && pm2 restart rejuvena-backend"

# Frontend
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run build && npx gh-pages -d out -m "Deploy: описание"
```

## Критические файлы

### Backend
- `src/routes/payment.routes.ts` - Payment creation with marathonId/marathonName metadata
- `src/routes/marathon.routes.ts` - Marathon management + enrollments
- `src/services/email.service.ts` - Resend email templates
- `src/scripts/send-marathon-notifications.ts` - Daily notifications script
- `ecosystem.config.json` - PM2 config (backend + cron)

### Frontend
- `src/pages/payment/success.tsx` - Success page with marathon details block
- `src/pages/marathons/[id]/start.tsx` - Marathon start page with countdown
- `src/pages/dashboard.tsx` - User dashboard (ready for marathon banner)
- `src/config/api.ts` - API URL configuration

## Известные состояния

### ✅ Работает
- Оплата премиума через Альфабанк
- Оплата марафонов через Альфабанк  
- Автозапись на марафон после оплаты
- Email уведомления (Resend)
- Ежедневные напоминания (PM2 cron)
- История платежей
- Админ панель управления заказами
- Фильтрация купленных марафонов
- Страница успешной оплаты марафона
- Страница старта марафона с таймером

### 🚧 В разработке
- Красивый баннер купленного марафона в дашборде (код готов, не закоммичен)
- Обратный отсчет до старта марафона в дашборде

### ⚠️ Примечания
- Локальный бэкенд остановлен (нужен для UI тестирования)
- GitHub Pages кэш: 10-15 минут на CDN
- CORS настроен для localhost и GitHub Pages
- Payment metadata включает marathonId/marathonName для корректных переходов

## Восстановление

Для восстановления этой версии:

```bash
# Backend
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git checkout 0619d4b
npm install
npm run build

# Frontend  
cd /Users/alexeipinaev/Documents/Rejuvena/web
git checkout 7798dba
npm install
npm run build
```

## Тестовые данные

### Пользователи
- seplitza@gmail.com / 1234back (superadmin, 2 марафона)
- testov3@mail.ru / test1234 (премиум, 1 марафон)
- asdfg@asdfg.asdfg / asdfgasdfg (1 марафон)

### Тестовые карты Альфабанк
- Успех: 4111 1111 1111 1111
- Отказ: 5555 5555 5555 4444
- CVV: любой 3-х значный
- Срок: любой будущий

## Контакты и доступы

- **VPS:** root@37.252.20.170
- **MongoDB:** localhost:27017/rejuvena
- **Resend API:** re_rj675j5x_DELv28yV2qGtTK5Dwzs6B872
- **GitHub:** seplitza/rejuvena (frontend), seplitza/Backend-rejuvena (backend)
