# 📘 Rejuvena - Инструкция по управлению проектом

**Дата создания:** 17 февраля 2026 г.  
**Последнее обновление:** 17 февраля 2026 г.  
**Статус:** Актуально для production

---

## 🎯 **Основные возможности платформы**

### Реализованные функции:
- ✅ **Марафоны** - Курсы упражнений с ежедневными заданиями
- ✅ **План дня** - Упражнения с видео, текстом и отслеживанием прогресса
- ✅ **Система чекбоксов** - Автоматическая проверка выполнения новых упражнений
- ✅ **Курсы** - Многоязычные курсы (RU/EN/ES и др.)
- ✅ **Фотодневник** - AI-определение возраста по фото (InsightFace)
- ✅ **Комментарии** - Комментарии к упражнениям
- ✅ **Категории** - Группировка упражнений по категориям
- ✅ **Покупки** - Оплата через Alfabank
- ✅ **Email кампании** - Автоматические рассылки через Resend
- ✅ **Admin Panel** - React админка для управления контентом
- ✅ **Динамические лендинги** - Создание лендингов через админку
- ✅ **Темы и языки** - Многоязычность и кастомизация

### Технологии:
- **Backend:** Node.js + TypeScript + Express + MongoDB
- **Frontend:** Next.js + TypeScript + Redux + Tailwind CSS
- **Admin Panel:** React + Vite + TipTap Editor
- **Age Detection:** Python Flask + InsightFace
- **Deployment:** GitHub Actions + PM2 + Nginx
- **Email:** Resend API
- **Payments:** Alfabank Payment Gateway

---

## 📍 **Расположение репозиториев**

### Локальные пути на MacBook:
```bash
# Backend + Admin Panel
/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/

# Frontend (новый)
/Users/alexeipinaev/Documents/Rejuvena/web/

# Age Bot API (определение возраста)
/Users/alexeipinaev/Documents/Rejuvena/age-bot-api/

# Frontend (старый для Azure курсов)
/Users/alexeipinaev/Documents/Rejuvena/Rejuvena_old_app/
```

### GitHub репозитории:
- **Backend:** https://github.com/seplitza/backend-rejuvena
- **Frontend (новый):** https://github.com/seplitza/rejuvena
- **Frontend (старый):** https://github.com/seplitza/Rejuvena_old_app

---

## 🌐 **Production URLs и доступы**

| Сервис | URL | Статус |
|--------|-----|--------|
| Backend API (прямой) | http://37.252.20.170:9527 | ⚠️ Может быть заблокирован по гео-IP |
| Backend API (Cloudflare) | https://backend.seplitza.ru | 🔧 Требует настройки (см. CLOUDFLARE_BACKEND_SETUP.md) |
| Backend (старый домен) | https://api-rejuvena.duckdns.org | ⚠️ Устаревший, заменить на Cloudflare |
| Admin Panel | https://backend.seplitza.ru/admin/ | 🔧 После настройки Cloudflare |
| Frontend (новый) | https://seplitza.github.io/rejuvena/ | ✅ Работает |
| Frontend (старый Azure) | https://seplitza.github.io/Rejuvena_old_app/ | 🗑️ Рудимент, не используется |
| Age Bot API (прямой) | http://37.252.20.170:5000 | ✅ Работает |
| Age Bot API (Cloudflare) | https://api.seplitza.ru/api/estimate-age | ✅ Работает (Cloudflare настроен) |
| Тест цветов RAL | https://seplitza.github.io/rejuvena/color-test | ✅ Работает |
| Курсы | https://seplitza.github.io/rejuvena/courses | ✅ Работает |
| Фотодневник | https://seplitza.github.io/rejuvena/photo-diary | ✅ Работает |

### ⚠️ ВАЖНО: Настройка Cloudflare для Backend API
**Проблема**: Прямой доступ к серверу `37.252.20.170:9527` блокируется из некоторых географических регионов.

**Решение**: Настроить Cloudflare прокси для обхода блокировок.

📘 **Инструкция**: [CLOUDFLARE_BACKEND_SETUP.md](./CLOUDFLARE_BACKEND_SETUP.md)

### Учетные данные Superadmin:
- **Email:** `seplitza@gmail.com`
- **Password:** `1234back`

---

## 🖥️ **Управление удаленным сервером (VPS)**

### Подключение к серверу:
```bash
# SSH подключение
ssh root@37.252.20.170

# Перейти в директорию проекта
cd /var/www/rejuvena-backend
```

### Информация о сервере:
- **IP:** 37.252.20.170
- **Провайдер:** Timeweb Cloud
- **Домен:** api-rejuvena.duckdns.org
- **ОС:** Ubuntu/Linux
- **Node.js:** v18.x
- **MongoDB:** v6.x (локально на сервере)

### Директории на сервере:
```bash
/var/www/rejuvena-backend/          # Основной код
├── dist/                            # Скомпилированный backend
├── admin-panel/                     # Админка (статика)
├── uploads/                         # Загруженные медиафайлы
│   ├── exercises/                   # Фото упражнений
│   └── photo-diary/                 # Фотодневник пользователей
├── logs/                            # PM2 логи
├── backups/                         # Бэкапы кода
├── node_modules/                    # Зависимости
└── .env                             # Переменные окружения (СЕКРЕТНО!)
```

---

## 🔄 **PM2 - Управление процессами**

### Основные команды PM2:

```bash
# Список всех процессов
pm2 list

# Статус процессов
pm2 status

# Просмотр логов (последние 50 строк)
pm2 logs rejuvena-backend --lines 50
pm2 logs marathon-notifier --lines 50
pm2 logs campaign-executor --lines 50
pm2 logs photo-cleanup --lines 50
pm2 logs photo-warnings --lines 50

# Просмотр LIVE логов (выход - Ctrl+C)
pm2 logs rejuvena-backend

# Рестарт процессов
pm2 restart rejuvena-backend        # Основной API
pm2 restart marathon-notifier       # Email уведомления марафонов
pm2 restart campaign-executor       # Email кампании
pm2 restart all                     # Все процессы

# Остановка процесса
pm2 stop rejuvena-backend

# Запуск процесса (если остановлен)
pm2 start rejuvena-backend

# Удаление процесса (ОСТОРОЖНО!)
pm2 delete rejuvena-backend

# Сохранить текущую конфигурацию PM2
pm2 save

# Мониторинг в реальном времени
pm2 monit

# Детальная информация о процессе
pm2 show rejuvena-backend
```

### Активные процессы (ecosystem.config.json):

1. **rejuvena-backend** 
   - Основной API сервер
   - Порт: 9527
   - Режим: cluster (1 инстанс)
   - Лог: `./logs/out.log`, `./logs/err.log`

2. **marathon-notifier**
   - Email уведомления участникам марафонов
   - Расписание: Каждый день в 09:00 MSK
   - Автозапуск: НЕТ (только по расписанию)
   - Лог: `./logs/notifier-out.log`

3. **campaign-executor**
   - Выполнение email кампаний
   - Расписание: Каждый час (00 минут)
   - Лог: `./logs/campaign-out.log`

4. **photo-cleanup**
   - Очистка старых фото из фотодневника
   - Расписание: Каждый день в 03:00 MSK
   - Лог: `./logs/photo-cleanup-out.log`

5. **photo-warnings**
   - Предупреждения об истечении фотодневника
   - Расписание: Каждый день в 10:00 MSK
   - Лог: `./logs/photo-warnings-out.log`

---

## 🗄️ **MongoDB - База данных**

### Подключение к MongoDB:

```bash
# На сервере
ssh root@37.252.20.170
mongosh mongodb://localhost:27017/rejuvena

# Локально (через SSH tunnel)
ssh -L 27017:localhost:27017 root@37.252.20.170
mongosh mongodb://localhost:27017/rejuvena
```

### Основные команды MongoDB:

```javascript
// Показать все коллекции
show collections

// Количество пользователей
db.users.countDocuments()

// Количество упражнений
db.exercises.countDocuments()

// Количество марафонов
db.marathons.countDocuments()

// Список всех администраторов
db.users.find({ role: { $in: ['superadmin', 'admin'] } })

// Найти пользователя по email
db.users.findOne({ email: 'seplitza@gmail.com' })

// Список активных марафонов
db.marathons.find({ isPublic: true, isDisplay: true })

// Последние 10 платежей
db.payments.find().sort({ createdAt: -1 }).limit(10)
```

### Backup и восстановление:

```bash
# БЭКАП (на сервере)
ssh root@37.252.20.170
mongodump --uri="mongodb://localhost:27017/rejuvena" \
  --archive=/tmp/rejuvena-backup-$(date +%Y%m%d).gz \
  --gzip

# Скачать backup локально
scp root@37.252.20.170:/tmp/rejuvena-backup-$(date +%Y%m%d).gz ./

# ВОССТАНОВЛЕНИЕ (ОСТОРОЖНО! Удаляет текущие данные)
mongorestore --uri="mongodb://localhost:27017/rejuvena" \
  --archive=/tmp/rejuvena-backup-20260217.gz \
  --gzip \
  --drop
```

### Коллекции базы данных:

- `users` - Пользователи (администраторы и участники)
- `exercises` - Упражнения для тренировок
- `exercisecategories` - Категории упражнений
- `daycategories` - Категории дней
- `tags` - Теги упражнений
- `marathons` - Марафоны
- `marathondays` - Дни марафонов с упражнениями
- `marathonenrollments` - Записи на марафоны
- `marathonexerciseprogresses` - Прогресс выполнения упражнений
- `landings` - Лендинги (динамические страницы)
- `payments` - Платежи через Alfabank
- `orders` - Заказы премиум доступа
- `exercisepurchases` - Покупки отдельных упражнений
- `offers` - Предложения и акции
- `campaigns` - Email кампании
- `campaignlogs` - Логи отправки email
- `emailtemplates` - Шаблоны email сообщений
- `photodiaries` - Фотодневники пользователей
- `comments` - Комментарии к упражнениям
- `modules` - Модули курсов
- `themes` - Темы оформления
- `languages` - Языковые версии
- `userbadges` - Бейджи пользователей
- `usernotes` - Заметки пользователей
- `errormessages` - Сообщения об ошибках

---

## 🚀 **Deployment - Развертывание изменений**

### ✅ АВТОМАТИЧЕСКИЙ ДЕПЛОЙ (рекомендуется)

**Backend изменения:**
```bash
# Перейти в директорию backend
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena

# Внести изменения в код

# Закоммитить и запушить
git add -A
git commit -m "Описание изменений"
git push

# GitHub Actions автоматически:
# 1. Скачает код на VPS
# 2. Установит зависимости (npm install)
# 3. Соберет backend (npm run build)
# 4. Соберет admin panel (npm run build)
# 5. Перезапустит PM2 (pm2 restart rejuvena-backend)
```

**Frontend изменения (Web App - seplitza.github.io/rejuvena):**
```bash
# Перейти в директорию frontend
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Внести изменения в код

# Закоммитить ТОЛЬКО В ЭТОМ РЕПОЗИТОРИИ
git add -A
git commit -m "Описание изменений"
git push

# ⚠️ ВАЖНО: Изменения в web/ НЕ пушатся через главный репозиторий!
# GitHub Actions в web/ репозитории автоматически:
# 1. Соберет Next.js (npm run build)
# 2. Задеплоит на GitHub Pages
# 3. Обновление через 2-3 минуты (CDN cache)
```

**Shop Frontend изменения (shop.seplitza.ru) - ✅ ПРАВИЛЬНЫЙ СПОСОБ:**
```bash
# ❌ НЕПРАВИЛЬНО: git pull на сервере
# Сервер /var/www/shop имеет remote → seplitza/shop.git (другой репо!)
# git pull не подтянет изменения из локальной папки shop-frontend/

# ✅ ПРАВИЛЬНО (Способ 1): rsync через SCP
cd /Users/alexeipinaev/Documents/Rejuvena/shop-frontend
npm run deploy:server

# ✅ ПРАВИЛЬНО (Способ 2): Через GitHub при проблемах с SSH
cd /Users/alexeipinaev/Documents/Rejuvena
git add shop-frontend/
git commit -m "Описание изменений shop"
git push origin main

# На сервере обновить файлы из GitHub:
ssh root@37.252.20.170 'bash -s' < /Users/alexeipinaev/Documents/Rejuvena/shop-frontend/server-pull-from-github.sh

# ⚠️ ВАЖНО: Shop использует localhost:9527 для API (shop+backend на одном сервере)
# .env.production: NEXT_PUBLIC_API_URL=http://localhost:9527

# Загрузить файл через SCP (изображения, публичные файлы)
scp /Users/alexeipinaev/Documents/Rejuvena/shop-frontend/public/logo.png \
  root@37.252.20.170:/var/www/shop/public/

# Проверить статус service
ssh root@37.252.20.170 'systemctl status seplitza-shop --no-pager | head -10'

# Проверить логи
ssh root@37.252.20.170 'journalctl -u seplitza-shop -n 50 --no-pager'
```

**⚠️ КРИТИЧЕСКИ ВАЖНО ПРО РЕПОЗИТОРИИ:**

| Компонент | Локальная папка | Git remote | Деплой |
|-----------|----------------|------------|--------|
| **Web App** | `/web` | отдельный репозиторий `seplitza/rejuvena` | GitHub Actions → GitHub Pages |
| **Shop** | `/shop-frontend` | живет внутри главного Rejuvena | ❌ НЕТ автодеплоя! Только SSH на сервер |
| **Backend** | `/Backend-rejuvena` | `seplitza/backend-rejuvena` | GitHub Actions → VPS |

**Почему Shop не деплоится автоматически:**
1. Shop код находится в папке `/shop-frontend/` главного репозитория
2. На сервере shop клонирован как **отдельный git репозиторий** из непубличного источника
3. `git remote -v` на сервере показывает: `origin https://github.com/seplitza/shop.git`
4. Главный репозиторий `Rejuvena` НЕ связан с этим remote

**Решение проблемы:**
1. Либо создать отдельный репозиторий для shop
2. Либо всегда деплоить вручную через SSH (текущий подход)
```

### 🔧 РУЧНОЙ ДЕПЛОЙ (если GitHub Actions не работает)

**Backend (ручной деплой):**
```bash
# Способ 1: Через SSH одной командой
ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && \
  git stash && \
  git pull && \
  npm install && \
  npm run build && \
  cd admin-panel && \
  npm install && \
  npm run build && \
  cd .. && \
  pm2 restart rejuvena-backend"

# Способ 2: Пошагово
ssh root@37.252.20.170
cd /var/www/rejuvena-backend
git stash                    # Сохранить локальные изменения
git pull                     # Скачать последний код
npm install                  # Обновить зависимости
npm run build                # Собрать backend
cd admin-panel
npm install                  # Обновить зависимости админки
npm run build                # Собрать админку
cd ..
pm2 restart rejuvena-backend # Перезапустить сервер
```

**Frontend (ручной деплой):**
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Собрать проект
npm run build

# Задеплоить на GitHub Pages
npx gh-pages -d out -m "Deploy: описание изменений"

# Подождать 2-3 минуты (GitHub Pages CDN cache)
```

---

## 📂 **Структура проектов**

### Backend-rejuvena:
```
Backend-rejuvena/
├── src/                         # Исходный код TypeScript
│   ├── models/                  # MongoDB модели
│   │   ├── User.model.ts
│   │   ├── Exercise.model.ts
│   │   ├── ExerciseCategory.model.ts
│   │   ├── DayCategory.model.ts
│   │   ├── Marathon.model.ts
│   │   ├── MarathonDay.model.ts
│   │   ├── MarathonEnrollment.model.ts
│   │   ├── MarathonExerciseProgress.model.ts
│   │   ├── Landing.model.ts
│   │   ├── Payment.model.ts
│   │   ├── ExercisePurchase.model.ts
│   │   ├── Offer.model.ts
│   │   ├── EmailCampaign.model.ts
│   │   ├── EmailTemplate.model.ts
│   │   ├── EmailLog.model.ts
│   │   ├── PhotoDiary.model.ts
│   │   ├── Comment.model.ts
│   │   ├── Module.model.ts
│   │   ├── Tag.model.ts
│   │   ├── Theme.model.ts
│   │   ├── Language.model.ts
│   │   ├── UserBadge.model.ts
│   │   ├── UserNote.model.ts
│   │   └── ErrorMessage.model.ts
│   ├── routes/                  # API endpoints
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── exercise.routes.ts
│   │   ├── exerciseCategory.routes.ts
│   │   ├── exercise-purchase.routes.ts
│   │   ├── marathon.routes.ts
│   │   ├── landing.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── offer.routes.ts
│   │   ├── email-campaign.routes.ts
│   │   ├── email-template.routes.ts
│   │   ├── photo-diary.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── comment-admin.routes.ts
│   │   ├── tag.routes.ts
│   │   ├── theme.routes.ts
│   │   ├── media.routes.ts
│   │   └── webhook.routes.ts
│   ├── middleware/              # Middlewares
│   │   └── auth.middleware.ts   # JWT проверка
│   ├── services/                # Бизнес-логика
│   │   ├── payment.service.ts   # Alfabank интеграция
│   │   └── email.service.ts     # Resend email отправка
│   ├── scripts/                 # Утилиты и cron jobs
│   │   ├── seed.ts              # Создание superadmin
│   │   ├── sendNotifications.ts # Email уведомления марафонов
│   │   ├── executeCampaigns.ts  # Email кампании
│   │   ├── cleanupPhotos.ts     # Очистка старых фото
│   │   └── sendPhotoWarnings.ts # Предупреждения фотодневник
│   └── server.ts                # Точка входа
├── admin-panel/                 # React Admin Panel (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ExerciseList.tsx
│   │   │   ├── MarathonEditor.tsx
│   │   │   ├── LandingEditor.tsx
│   │   │   └── CampaignList.tsx
│   │   ├── components/
│   │   │   ├── TipTapEditor.tsx # Rich text editor
│   │   │   └── Layout.tsx
│   │   └── api/
│   │       └── client.ts        # Axios instance
│   └── dist/                    # Собранная админка (деплой)
├── uploads/                     # Загруженные файлы
│   ├── exercises/               # Медиа для упражнений
│   └── photo-diary/             # Фотодневник пользователей
│       ├── originals/
│       └── cropped/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions конфиг
├── ecosystem.config.json        # PM2 конфигурация
├── package.json
├── tsconfig.json
└── .env                         # Переменные окружения (НЕ в Git!)
```

### web (Frontend):
```
web/
├── src/
│   ├── pages/                   # Next.js страницы
│   │   ├── landing/
│   │   │   └── [slug].tsx       # Динамический лендинг
│   │   ├── courses/             # Курсы (НОВОЕ!)
│   │   │   └── [courseId]/      # Детали курса
│   │   │       └── day/
│   │   │           └── [dayNumber].tsx
│   │   ├── courses.tsx          # Список курсов (НОВОЕ!)
│   │   ├── exercises/           # Список упражнений
│   │   │   └── [exerciseId].tsx # Детали упражнения
│   │   ├── marathons/           # Марафоны
│   │   │   ├── index.tsx        # Список марафонов
│   │   │   ├── [id].tsx         # Детали марафона
│   │   │   └── [id]/day/[dayNumber].tsx
│   │   ├── payment/             # Оплата
│   │   │   ├── success.tsx
│   │   │   └── fail.tsx
│   │   ├── profile/             # Профиль пользователя
│   │   ├── photo-diary.tsx      # Фотодневник (НОВОЕ!)
│   │   ├── color-test.tsx       # Тест RAL цветов
│   │   ├── dashboard.tsx
│   │   └── guest.tsx            # Гостевая страница
│   ├── components/              # React компоненты
│   │   ├── landing/             # Секции лендинга
│   │   │   ├── AnimatedStartDate.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   ├── VideoCarousel.tsx
│   │   │   └── ResultsGallerySection.tsx
│   │   ├── day/                 # Компоненты дней марафона (НОВОЕ!)
│   │   │   ├── DayPlan.tsx      # План дня с категориями
│   │   │   ├── ExerciseItem.tsx # Элемент упражнения с чекбоксом
│   │   │   ├── ExerciseDetailModal.tsx # Модальное окно упражнения
│   │   │   ├── DayHeader.tsx
│   │   │   ├── DayDescription.tsx
│   │   │   └── DaysList.tsx
│   │   ├── courses/             # Компоненты курсов (НОВОЕ!)
│   │   │   ├── MyCourseCard.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   └── CourseDetailModal.tsx
│   │   ├── comments/            # Система комментариев (НОВОЕ!)
│   │   ├── user-access-status/  # Статус доступа (НОВОЕ!)
│   │   ├── PaymentModal.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── MarathonCarousel.tsx
│   ├── store/                   # Redux state management
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── courses/         # Курсы (НОВОЕ!)
│   │   │   └── day/             # Дни марафона (НОВОЕ!)
│   │   ├── rootReducer.ts
│   │   ├── rootSaga.ts
│   │   └── store.ts
│   ├── config/
│   │   └── api.ts               # API URL конфигурация
│   ├── utils/
│   │   └── i18n.ts              # Многоязычность (НОВОЕ!)
│   └── styles/                  # CSS/Tailwind
├── public/                      # Статические файлы
├── out/                         # Next.js build (деплой на GitHub Pages)
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions конфиг
├── next.config.js               # Next.js конфигурация
├── tailwind.config.js
└── package.json
```

---

## 🔐 **Переменные окружения (.env)**

### Backend (.env на сервере):
```bash
# НЕ КОММИТИТЬ В GIT!
# Находится: /var/www/rejuvena-backend/.env

NODE_ENV=production
PORT=9527

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rejuvena

# JWT
JWT_SECRET=rejuvena_prod_secret_2026

# Alfabank Test Gateway (оплата)
ALFABANK_USERNAME=your_username
ALFABANK_PASSWORD=your_password
ALFABANK_RETURN_URL=https://seplitza.github.io/rejuvena/payment/success
ALFABANK_FAIL_URL=https://seplitza.github.io/rejuvena/payment/fail

# Resend (email сервис)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@mail.seplitza.ru

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your_token
```

### Frontend (.env.production):
```bash
# Автоматически используется при npm run build
NEXT_PUBLIC_API_URL=http://37.252.20.170:9527
```

---

## 🧪 **Локальная разработка**

### Запуск Backend локально:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena

# Установить зависимости (первый раз)
npm install

# Запустить MongoDB (если не запущен)
brew services start mongodb-community

# Создать superadmin (первый раз)
npm run seed

# Запустить в режиме разработки (auto-restart)
npm run dev

# Backend доступен на http://localhost:9527
```

### Запуск Frontend локально:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Установить зависимости (первый раз)
npm install

# Запустить в режиме разработки (hot reload)
npm run dev

# Frontend доступен на http://localhost:3000
```

### Запуск Admin Panel локально:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel

# Установить зависимости (первый раз)
npm install

# Запустить
npm run dev

# Admin Panel доступен на http://localhost:5173
```

---

## 📧 **Email система (Resend)**

### Информация:
- **Сервис:** Resend (resend.com)
- **Лимит:** 100 emails/день (free tier)
- **От кого:** noreply@mail.seplitza.ru
- **API Key:** в .env файле на сервере

### Типы отправляемых email:
1. **Регистрация** - приветственное письмо с паролем
2. **Запись на марафон** - подтверждение записи
3. **Начало марафона** - за день до старта
4. **Ежедневные напоминания** - каждое утро в 9:00 MSK
5. **Завершение марафона** - поздравление
6. **Email кампании** - массовые рассылки
7. **Предупреждения фотодневник** - напоминание о загрузке фото

### Проверка логов email:
```bash
# На сервере
pm2 logs marathon-notifier --lines 100
pm2 logs campaign-executor --lines 100
pm2 logs photo-warnings --lines 100
```

---

## 🤖 **Age Bot API - Определение возраста по фото**

### Информация:
- **Расположение:** `/Users/alexeipinaev/Documents/Rejuvena/age-bot-api/`
- **Технология:** Flask + InsightFace (buffalo_sc model)
- **Порт:** 5000
- **Прокси:** Cloudflare (api.seplitza.ru)
- **Использование:** Фотодневник (photo-diary.tsx)

### Production URLs:
- **Прямой:** http://37.252.20.170:5000/api/estimate-age
- **Через Cloudflare:** https://api.seplitza.ru/api/estimate-age

### API Endpoint:
```bash
# POST /api/estimate-age
# Content-Type: application/json
# Body: { "image": "data:image/jpeg;base64,..." }

curl -X POST http://37.252.20.170:5000/api/estimate-age \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'

# Response:
# { "age": 35, "confidence": 0.95, "status": "success" }
```

### Управление Age Bot на сервере:
```bash
# Проверить статус
ssh root@37.252.20.170 "systemctl status age-bot"

# Перезапустить
ssh root@37.252.20.170 "systemctl restart age-bot"

# Посмотреть логи
ssh root@37.252.20.170 "journalctl -u age-bot -n 100"

# Health check
curl http://37.252.20.170:5000/health
```

### Локальная разработка Age Bot:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/age-bot-api

# Создать виртуальное окружение (первый раз)
python3 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Запустить локально
python app.py

# API доступен на http://localhost:5000
```

### Деплой Age Bot:
```bash
# Автоматический деплой через скрипт
cd /Users/alexeipinaev/Documents/Rejuvena/age-bot-api
./deploy.sh

# Или вручную:
scp app.py requirements.txt root@37.252.20.170:/var/www/age-bot-api/
ssh root@37.252.20.170
cd /var/www/age-bot-api
pip install -r requirements.txt
systemctl restart age-bot
```

---

## 🛠️ **Полезные команды**

### Проверка здоровья системы:
```bash
# API health check
curl http://37.252.20.170:9527/health

# Список упражнений
curl http://37.252.20.170:9527/api/exercises/public

# Проверка MongoDB
ssh root@37.252.20.170 "systemctl status mongod"

# Проверка Nginx
ssh root@37.252.20.170 "systemctl status nginx"

# Проверка PM2
ssh root@37.252.20.170 "pm2 status"
```

### Очистка и обслуживание:
```bash
# Очистка старых логов PM2
ssh root@37.252.20.170 "pm2 flush"

# Очистка старых бэкапов (старше 30 дней)
ssh root@37.252.20.170 "find /var/www/rejuvena-backend/backups -mtime +30 -delete"

# Проверка свободного места
ssh root@37.252.20.170 "df -h"

# Размер папки uploads
ssh root@37.252.20.170 "du -sh /var/www/rejuvena-backend/uploads"
```

### Скрипты npm (package.json):
```bash
# Backend
npm run dev              # Разработка (nodemon)
npm run build            # Компиляция TypeScript
npm start                # Запуск production (node dist/server.js)
npm run seed             # Создание superadmin
npm run send-notifications    # Отправка email марафонов
npm run execute-campaigns     # Выполнение email кампаний
npm run cleanup-photos        # Очистка старых фото
npm run send-photo-warnings   # Предупреждения фотодневник

# Frontend
npm run dev              # Разработка (hot reload)
npm run build            # Билд Next.js в ./out
npm start                # Запуск production сервера
```

---

## ⚙️ **GitHub Actions Secrets**

### Backend репозиторий (backend-rejuvena):
Настроены в Settings → Secrets and variables → Actions:

- `SERVER_HOST`: `37.252.20.170`
- `SERVER_USER`: `root`
- `SERVER_PASSWORD`: `[пароль SSH]`

### Frontend репозиторий (rejuvena):
GitHub Pages использует встроенный `GITHUB_TOKEN` автоматически.

---

## 🚨 **Troubleshooting - Решение проблем**

### Backend не запускается:
```bash
# Проверить логи
ssh root@37.252.20.170
pm2 logs rejuvena-backend --lines 100

# Проверить MongoDB
systemctl status mongod
# Если не работает:
systemctl restart mongod

# Проверить порт 9527
netstat -tuln | grep 9527
# Если занят другим процессом:
lsof -i :9527
kill -9 [PID]

# Пересоздать процесс
cd /var/www/rejuvena-backend
pm2 delete rejuvena-backend
pm2 start ecosystem.config.json
pm2 save
```

### Frontend показывает старую версию:
```bash
# GitHub Pages cache (2-3 минуты)
# Жесткая перезагрузка в браузере:
# Chrome/Firefox: Ctrl + Shift + R
# Safari: Cmd + Option + R

# Проверить последний деплой
# https://github.com/seplitza/rejuvena/actions
```

### Email не отправляются:
```bash
# Проверить логи
pm2 logs marathon-notifier --lines 50
pm2 logs campaign-executor --lines 50

# Проверить Resend API key
ssh root@37.252.20.170
cat /var/www/rejuvena-backend/.env | grep RESEND

# Проверить лимит Resend (100 emails/день)
# Зайти на resend.com → Dashboard → Usage
```

### База данных проблемы:
```bash
# Проверить подключение
ssh root@37.252.20.170
mongosh mongodb://localhost:27017/rejuvena

# Если не подключается - перезапустить MongoDB
systemctl restart mongod

# Проверить место на диске
df -h

# Проверить логи MongoDB
journalctl -u mongod -n 100
```

### Age Bot API не работает:
```bash
# Проверить статус
ssh root@37.252.20.170
systemctl status age-bot

# Если не работает:
systemctl restart age-bot

# Проверить логи
journalctl -u age-bot -n 100 --no-pager

# Проверить health
curl http://37.252.20.170:5000/health

# Проверить модель загружена
curl http://37.252.20.170:5000/health | grep model_loaded

# Проверить порт 5000
netstat -tuln | grep 5000
```

### Cloudflare прокси для Age Bot:
```bash
# Проверить через Cloudflare
curl https://api.seplitza.ru/api/estimate-age \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQ..."}'

# Если не работает - проверить настройки Cloudflare DNS
# См. документацию: /age-bot-api/CLOUDFLARE_SETUP.md
```

---

## 📞 **Контакты и поддержка**

**GitHub Issues:**
- Backend: https://github.com/seplitza/backend-rejuvena/issues
- Frontend: https://github.com/seplitza/rejuvena/issues

**Документация:**
- Backend README: `/Backend-rejuvena/README.md`
- Frontend README: `/web/README.md`
- Deployment Workflow: `/Backend-rejuvena/DEPLOYMENT_WORKFLOW.md`
- Quick Start: `/Backend-rejuvena/QUICKSTART.md`
- Age Bot API Docs: `/age-bot-api/API_DOCS.md`

---

## 📝 **История последних изменений**

### 17 февраля 2026 г.
- ✅ **Исправлена логика чекбоксов** для новых упражнений в Плане дня
  - Расширена проверка всех источников описания (4 поля вместо 2)
  - Добавлена поддержка RuTube для отслеживания просмотра видео
  - Автоматическая проверка необходимости прокрутки для коротких текстов
  - Для новых упражнений галочка появляется только после полного просмотра
- ✅ **Обновлена документация** DEPLOYMENT_GUIDE_FOR_TEAM.md
  - Добавлены новые модели и роуты Backend
  - Добавлены новые компоненты и страницы Frontend
  - Добавлена информация об Age Bot API
  - Обновлена структура Redux store

### Предыдущие обновления:
- **Фотодневник** - AI определение возраста (InsightFace)
- **Система курсов** - Многоязычные курсы с модульной структурой
- **Категории дней** - Группировка упражнений в Плане дня
- **Комментарии** - Комментарии к упражнениям и видео
- **Email шаблоны** - Кастомизируемые шаблоны email
- **Темы и языки** - Поддержка нескольких языков и тем оформления

---

## ✅ **Чеклист перед деплоем**

- [ ] Код работает локально (npm run dev)
- [ ] Нет ошибок TypeScript (npm run build)
- [ ] Изменения закоммичены в Git
- [ ] Все зависимости обновлены в package.json
- [ ] .env файлы не попали в Git
- [ ] Тесты пройдены (если есть)
- [ ] Проверен в разных браузерах (для frontend)
- [ ] Создан backup базы данных (для критических изменений)
- [ ] Команда уведомлена о деплое

---

**Успехов в работе! 🚀**

---

*Файл создан AI-агентом для упрощения работы команды.*
*При возникновении вопросов - обращайтесь к этому документу.*
