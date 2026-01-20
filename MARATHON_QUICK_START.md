# 🚀 Marathon System - Quick Start Guide

## Текущий статус

✅ **Backend:** Полностью готов и задеплоен  
✅ **Admin Panel:** Интегрирован и работает  
✅ **Email Notifications:** Настроены (требуется RESEND_API_KEY)  
⏳ **Frontend:** Готов к деплою (файлы в `docs/frontend/`)

---

## Быстрый старт для деплоя Frontend

### Вариант 1: Автоматический скрипт (рекомендуется)

```bash
# Запустить скрипт деплоя
./deploy-marathon-frontend.sh
```

Скрипт автоматически:
- Скопирует файлы в `/web/src/pages/marathons/`
- Создаст структуру директорий
- Добавит типы TypeScript
- Предложит обновить PaymentModal
- Запустит dev сервер для тестирования

### Вариант 2: Ручное копирование

```bash
# Перейти в web репозиторий
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Создать директории
mkdir -p src/pages/marathons/[id]/day

# Скопировать файлы
cp ../Backend-rejuvena/docs/frontend/pages/marathons.tsx src/pages/marathons/index.tsx
cp ../Backend-rejuvena/docs/frontend/pages/marathon-detail.tsx src/pages/marathons/[id].tsx
cp ../Backend-rejuvena/docs/frontend/pages/marathon-day.tsx src/pages/marathons/[id]/day/[dayNumber].tsx

# Тестировать
npm run dev

# Собрать и задеплоить
npm run build
npx gh-pages -d out -m "Deploy marathon feature"
```

### Вариант 3: Подробная документация

Следовать инструкциям в: [MARATHON_FRONTEND_DEPLOY.md](MARATHON_FRONTEND_DEPLOY.md)

---

## Команды для тестирования

### Backend (уже запущен)

```bash
# Локальная разработка
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
npm run dev

# Проверить марафоны
curl http://localhost:9527/api/marathons

# Отправить тестовые уведомления
npm run send-notifications
```

### Frontend (после копирования файлов)

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Разработка
npm run dev
# → http://localhost:3000/marathons

# Сборка
npm run build

# Деплой
npx gh-pages -d out -m "Marathon feature"
```

---

## Production URLs

После деплоя:

- **Frontend:** https://seplitza.github.io/rejuvena/marathons
- **Backend API:** http://37.252.20.170:9527/api/marathons
- **Admin Panel:** http://37.252.20.170:9527/admin/marathons

---

## Проверочный список

### До деплоя:
- [ ] Скопировать файлы в `/web`
- [ ] Обновить импорты (если нужно)
- [ ] Протестировать локально (`npm run dev`)
- [ ] Проверить сборку (`npm run build`)
- [ ] Закоммитить в Git

### После деплоя:
- [ ] Открыть https://seplitza.github.io/rejuvena/marathons
- [ ] Проверить список марафонов
- [ ] Проверить детальную страницу
- [ ] Проверить запись на марафон
- [ ] Проверить оплату (тестовая карта)
- [ ] Проверить страницу дня

---

## Создание первого марафона

### Через Admin Panel:

1. Открыть: http://37.252.20.170:9527/admin/marathons
2. Нажать **"+ Создать марафон"**
3. Заполнить данные:
   - **Название:** "Омолодись за 21 день"
   - **Дата старта:** Выбрать дату (например, через 3 дня)
   - **Количество дней:** 21
   - **Стоимость:** 1990 или 0 (бесплатно)
   - **Флаги:** isPublic ✓, isDisplay ✓
4. Перейти на вкладку **"Упражнения"**
5. Добавить дни и выбрать упражнения
6. Сохранить

### Через MongoDB (быстрый тест):

```javascript
db.marathons.insertOne({
  title: "Тестовый марафон",
  startDate: new Date(Date.now() + 86400000 * 3), // через 3 дня
  numberOfDays: 7,
  tenure: 7,
  cost: 0, // бесплатно
  isPaid: false,
  isPublic: true,
  isDisplay: true,
  hasContest: false,
  language: "ru",
  welcomeMessage: "<p>Добро пожаловать на марафон!</p>",
  courseDescription: "<p>Описание марафона</p>",
  rules: "<p>Правила участия</p>",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Настройка Email уведомлений (Production)

1. Зарегистрироваться на https://resend.com
2. Получить API Key
3. Добавить в `.env` на сервере:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=noreply@rejuvena.com
   ```
4. Перезапустить PM2:
   ```bash
   pm2 restart rejuvena-backend
   pm2 restart ecosystem.config.json --update-env
   ```

Проверить работу:
```bash
pm2 logs marathon-notifier
```

---

## Мониторинг

### Проверить записи на марафоны:

```javascript
// В MongoDB
db.marathonEnrollments.countDocuments()
db.marathonEnrollments.find().pretty()
```

### Проверить платежи:

```javascript
db.payments.find({ "metadata.type": "marathon" }).pretty()
```

### Проверить логи:

```bash
# Backend
pm2 logs rejuvena-backend --lines 50

# Notifications
pm2 logs marathon-notifier --lines 50
```

---

## Документация

- **Полный обзор:** [MARATHON_COMPLETE.md](MARATHON_COMPLETE.md)
- **Email уведомления:** [MARATHON_EMAIL_NOTIFICATIONS.md](MARATHON_EMAIL_NOTIFICATIONS.md)
- **Тестирование платежей:** [MARATHON_PAYMENT_TESTING.md](MARATHON_PAYMENT_TESTING.md)
- **Деплой Frontend:** [MARATHON_FRONTEND_DEPLOY.md](MARATHON_FRONTEND_DEPLOY.md)
- **Интеграция Frontend:** [docs/frontend/MARATHON_INTEGRATION_GUIDE.md](docs/frontend/MARATHON_INTEGRATION_GUIDE.md)

---

## Получить помощь

**Backend проблемы:**
- Проверить: `pm2 logs rejuvena-backend`
- MongoDB: `mongosh rejuvena`

**Frontend проблемы:**
- Проверить: `npm run build` вывод
- Console: F12 → Network tab

**Email проблемы:**
- Проверить: Resend dashboard
- Логи: `pm2 logs marathon-notifier`

---

## ✅ Всё готово!

Система марафонов полностью реализована и готова к использованию.

**Следующий шаг:** Запустить `./deploy-marathon-frontend.sh` для деплоя на GitHub Pages! 🚀
