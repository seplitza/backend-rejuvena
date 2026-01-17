# 🎯 ТОЧКА ВОССТАНОВЛЕНИЯ - 17 января 2026

## ✅ СТАТУС: ПОЛНОСТЬЮ РАБОТАЕТ

**Дата:** 17 января 2026, 09:30 MSK  
**Тестировал:** Alexei Pinaev  
**Результат:** ✅ Логин + Платежи работают на production

---

## 🔧 ЧТО РАБОТАЕТ

### 1. Unified Authentication
- ✅ Логин через новый бэкенд `https://api-rejuvena.duckdns.org/api/auth/login`
- ✅ Case-insensitive email (Seplitza@gmail.com = seplitza@gmail.com)
- ✅ Один JWT токен для всех запросов
- ✅ Fallback на Azure (конфигурирован, но Azure недоступен)

### 2. Payment Integration (Alfabank)
- ✅ Создание платежа работает
- ✅ Редирект на Alfabank Test Gateway
- ✅ Интеграция протестирована с тестовым пользователем

### 3. Frontend
- ✅ Деплой на GitHub Pages
- ✅ Удалена кнопка Facebook
- ✅ Добавлен toggle показа пароля
- ✅ Все API запросы идут на новый бэкенд

---

## 📦 КОММИТЫ

### Backend (github.com/seplitza/backend-rejuvena)
```
6ebb583 ✅ CHECKPOINT: Unified Auth + Payment WORKING (17 Jan 2026)
dbb1809 Fix: Azure API fallback - use OAuth2 format (username + grant_type)
99e6647 Fix: make email case-insensitive in login/register
3ba51db Add detailed Azure API error logging
1d42c00 Fix: correct frontend repo URL in documentation
a9741ba Implement Unified Auth with Azure fallback (Strangler Fig pattern)
```

### Frontend (github.com/seplitza/rejuvena)
```
05b980b Add password visibility toggle and remove Facebook button
dc2795b Fix: restore working login.tsx (previous version was corrupted)
783ad48 Add password visibility toggle and remove Facebook button
155c9f3 Fix: use HTTPS backend URL (api-rejuvena.duckdns.org)
af53418 Fix: update .env.production to use new unified backend
```

### GitHub Pages Deploy (gh-pages branch)
```
aa7c61d Deploy: Fix Facebook button removal + case-insensitive email (17 Jan)
```

---

## 🔐 ТЕСТОВЫЕ КРЕДЫ

### Тестовый пользователь (РАБОТАЕТ)
- **Email:** `testuser@rejuvena.com`
- **Пароль:** `Test123456`
- **База:** Локальная MongoDB на 37.252.20.170
- **Статус:** ✅ Проверен 17.01.2026

### Alfabank Test Gateway
- **URL:** https://alfa.rbsuat.com/payment/rest
- **Credentials:** r-seplitza-api / seplitza*?1
- **Test Card:** 4111 1111 1111 1111
- **CVC:** 123
- **Exp:** 12/24
- **Name:** SUCCESS PAYMENT

---

## 🏗️ АРХИТЕКТУРА

### Серверы
- **Production:** 37.252.20.170
- **Domain:** api-rejuvena.duckdns.org (HTTPS)
- **PM2 Process:** rejuvena-backend (restart #39)
- **MongoDB:** localhost:27017/rejuvena

### URLs
- **Backend API:** https://api-rejuvena.duckdns.org (port 9527)
- **Admin Panel:** https://api-rejuvena.duckdns.org/admin/
- **Frontend:** https://seplitza.github.io/rejuvena/

### Репозитории
1. **Backend:** https://github.com/seplitza/backend-rejuvena
   - Local: `/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena`
   - Server: `/var/www/rejuvena-backend`

2. **Frontend:** https://github.com/seplitza/rejuvena
   - Local: `/Users/alexeipinaev/Documents/Rejuvena/web`
   - Deploy: gh-pages branch

---

## 🔄 STRANGLER FIG PATTERN

```
┌─────────────────────────────────────────────────────────────┐
│  ФРОНТЕНД (один токен)                                      │
│  https://seplitza.github.io/rejuvena/                      │
└──────────────────┬──────────────────────────────────────────┘
                   │ Authorization: Bearer <JWT>
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  НОВЫЙ БЭКЕНД (https://api-rejuvena.duckdns.org)           │
│                                                              │
│  ✅ /api/auth/login (unified auth + Azure fallback)        │
│  ✅ /api/payment/* (Alfabank integration)                  │
│  ✅ /api/exercises/* (local MongoDB)                       │
│  🔄 /api/courses/* (planned: proxy to Azure)               │
└───────────────────────┬─────────────────────────────────────┘
                        │ (fallback для legacy users)
                        ▼
           ┌────────────────────────────────┐
           │  AZURE API (ВРЕМЕННО НЕДОСТУПЕН)│
           │  new-facelift-service-...net   │
           └────────────────────────────────┘
```

---

## 📝 КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ

### auth.routes.ts
- Email normalization: `.toLowerCase().trim()`
- Azure fallback endpoint: `/token/auth` (OAuth2)
- Azure request format: `{username, password, grant_type: 'password'}`
- User profile fetch after Azure login
- Legacy user creation with `isLegacyUser: true`

### Frontend API Config
- Base URL: `https://api-rejuvena.duckdns.org`
- Login endpoint: `/api/auth/login`
- Request format: `{email, password}` (simple, не OAuth2)
- Response: `{token, user}` (один JWT)

### Payment Integration
- Service: `src/services/alfabank.service.ts`
- Model: `src/models/Payment.model.ts`
- Routes: `src/routes/payment.routes.ts`
- Component: `src/components/payment/PremiumPlanCard.tsx`

---

## 🚨 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

1. **Azure API недоступен**
   - Status: ENOTFOUND error на сервере
   - Impact: Legacy пользователи не могут войти через fallback
   - Workaround: Создавать новых пользователей локально

2. **DNS api-rejuvena.duckdns.org**
   - Status: ✅ Работает через HTTPS
   - Previously: Не резолвился, использовали IP
   - Fixed: 16-17 января 2026

3. **GitHub Pages CDN Cache**
   - Может кешировать старые файлы до 24 часов
   - Workaround: Unpublish/republish или изменить имя repo

---

## 🔄 КАК ВОССТАНОВИТЬ

Если что-то сломалось, вернись к этому состоянию:

### Backend
```bash
cd /var/www/rejuvena-backend
git fetch origin
git checkout 6ebb583  # Этот коммит
pm2 restart rejuvena-backend
```

### Frontend (локально)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git checkout 05b980b  # Последний рабочий коммит main
npm run build
npx gh-pages -d out -m "Restore to working state 17 Jan 2026"
```

### Frontend (GitHub Pages)
```bash
# В настройках GitHub Pages:
# Source: Deploy from branch
# Branch: gh-pages
# Folder: / (root)
# Commit aa7c61d содержит рабочий код
```

### MongoDB
```bash
# Проверить пользователей
mongosh rejuvena --eval 'db.users.find({}, {email: 1, role: 1, isLegacyUser: 1})'

# Создать тестового пользователя если нужно
curl "https://api-rejuvena.duckdns.org/api/auth/register" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"testuser@rejuvena.com","password":"Test123456"}'
```

---

## ✅ ТЕСТЫ ПРОХОЖДЕНИЯ

- [x] Логин с testuser@rejuvena.com успешен
- [x] JWT токен получен
- [x] Dashboard загружается
- [x] Кнопка "Оплатить 990 ₽" работает
- [x] Редирект на Alfabank происходит
- [x] API запросы идут на https://api-rejuvena.duckdns.org
- [x] Case-insensitive email работает
- [x] Кнопка Facebook удалена
- [x] Toggle пароля работает

---

## 📚 ДОКУМЕНТАЦИЯ

- [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md) - полная инструкция по деплою
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - общее описание проекта
- Backend API Docs: см. `/src/routes/` для endpoints
- Frontend: Next.js 14.2.33 с static export

---

**ЭТОТ ФАЙЛ - СНИМОК РАБОЧЕГО СОСТОЯНИЯ. НЕ УДАЛЯТЬ!**
