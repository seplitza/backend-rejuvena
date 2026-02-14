# 🔄 Точка восстановления: 14 февраля 2026 г.

## 📋 Краткое описание версии

**Версия:** v1.4.0 - Video Embed Support  
**Дата создания:** 14 февраля 2026 г., 15:40 МСК  
**Статус:** ✅ Стабильная, протестированная версия

### Ключевые изменения в этой версии:

1. ✅ **Навигация по марафонам** - кнопка на баннере ведет на текущий день (не на страницу старта)
2. ✅ **Поддержка видео в TipTap редакторе** - YouTube, Vimeo, Rutube, VK, OK.ru
3. ✅ **Исправлено форматирование заголовков** - явные CSS стили для H1/H2/H3
4. ✅ **Обновление lastAccessedDay** - теперь обновляется при просмотре дня (не только при завершении)

---

## 🔗 Git коммиты для восстановления

### Backend Repository: `backend-rejuvena`
```bash
Repository: https://github.com/seplitza/backend-rejuvena.git
Commit: d58c280
Branch: main
Subject: feat: add video embed support (YouTube, Vimeo, Rutube, VK, OK) to TipTap editor
```

**Предыдущие коммиты в этой сессии:**
- `50958c0` - fix: update lastAccessedDay on day view for better UX tracking
- `3cc3ff5` - Revert "feat: auto-migrate marathon progress index on server startup"
- `3aa8e2d` - fix: include dayNumber in marathon exercise progress unique index

### Frontend Repository: `rejuvena` (web)
```bash
Repository: https://github.com/seplitza/rejuvena.git
Commit: f31937c
Branch: main
Subject: fix: use explicit CSS styles for marathon day headings formatting
```

**Предыдущие коммиты в этой сессии:**
- `b73b359` - fix: increase heading sizes in marathon day description for better readability
- `b7f366c` - fix: marathon banner always navigates to current day when started
- `c0019ab` - feat: implement smart marathon banner navigation logic

---

## 🚀 Инструкции по восстановлению

### Вариант 1: Восстановление через Git (рекомендуется)

#### Backend:
```bash
# Локально
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git fetch origin
git checkout d58c280
# Если нужно создать ветку
git checkout -b restore-video-support d58c280

# Установка зависимостей и сборка
npm install
npm run build
cd admin-panel
npm install
npm run build
cd ..

# На продакшн сервере
ssh root@37.252.20.170
cd /var/www/rejuvena-backend
git fetch origin
git checkout d58c280
npm install
npm run build
cd admin-panel
npm install
npm run build
cd ..
pm2 restart rejuvena-backend
```

#### Frontend:
```bash
# Локально
cd /Users/alexeipinaev/Documents/Rejuvena/web
git fetch origin
git checkout f31937c
# Если нужно создать ветку
git checkout -b restore-video-support f31937c

# Тестирование локально
npm install
npm run dev

# Деплой на GitHub Pages
npm run build
npx gh-pages -d out -m "Restore: video support version"
```

### Вариант 2: Восстановление с нуля (полная переустановка)

#### Backend:
```bash
# Клонирование репозитория
cd /Users/alexeipinaev/Documents/Rejuvena
rm -rf Backend-rejuvena-backup
git clone https://github.com/seplitza/backend-rejuvena.git Backend-rejuvena-backup
cd Backend-rejuvena-backup
git checkout d58c280

# Настройка окружения
npm install
cp .env.example .env
# Отредактировать .env с актуальными данными

# Сборка
npm run build

# Админ-панель
cd admin-panel
npm install
npm run build
cd ..

# Запуск
npm run dev  # Локально
# или
pm2 start ecosystem.config.json  # На продакшене
```

#### Frontend:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena
rm -rf web-backup
git clone https://github.com/seplitza/rejuvena.git web-backup
cd web-backup
git checkout f31937c

npm install
npm run build
# Для деплоя
npx gh-pages -d out -m "Restore version"
```

---

## 📊 Текущее состояние системы

### Backend
- **Node.js:** v18+
- **MongoDB:** v5.0+
- **Express:** работает на порту 9527
- **PM2:** процессы `rejuvena-backend` и `marathon-notifier`

#### Критические зависимости:
```json
{
  "@tiptap/core": "^2.8.0",
  "@tiptap/react": "^2.8.0",
  "@tiptap/starter-kit": "^2.8.0",
  "@tiptap/extension-image": "^2.8.0",
  "@tiptap/extension-link": "^2.8.0",
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "bcrypt": "^5.1.1"
}
```

#### Модели данных:
- `User` - пользователи с премиум-подпиской
- `Exercise` - упражнения с TipTap контентом
- `Marathon` - марафоны
- `MarathonDay` - дни марафона с `description` (TipTap HTML)
- `MarathonExerciseProgress` - прогресс по упражнениям (уникальный индекс: userId + marathonId + dayNumber + exerciseId)
- `MarathonEnrollment` - записи на марафон с `lastAccessedDay`

### Frontend
- **Next.js:** 14.2.33 (static export)
- **React:** 18+
- **Redux Toolkit:** для state management
- **Tailwind CSS:** для стилей
- **Deployment:** GitHub Pages

#### Критические файлы:
- `pages/dashboard.tsx` - главная страница с баннерами марафонов
- `pages/marathons/[id]/day/[dayNumber].tsx` - страница дня марафона
- `components/day/DayDescription.tsx` - компонент описания дня (с форматированием заголовков)
- `store/modules/day/` - Redux логика для дней марафона

### Production URLs:
- **Backend API:** http://37.252.20.170:9527 (api-rejuvena.duckdns.org)
- **Frontend (New):** https://seplitza.github.io/rejuvena/
- **Admin Panel:** https://api-rejuvena.duckdns.org/admin/

---

## ✅ Функционал на момент бэкапа

### Полностью работающие фичи:

#### Марафоны:
- ✅ Создание/редактирование марафонов через админку
- ✅ Дни марафона с упражнениями и категориями
- ✅ Прогресс пользователя по дням
- ✅ Навигация на текущий день марафона (после старта)
- ✅ Отображение обратного отсчета до старта
- ✅ Оплата через Альфа-банк
- ✅ Email уведомления (Resend) - ежедневные напоминания

#### TipTap редактор:
- ✅ Форматирование текста (жирный, курсив, заголовки H1/H2/H3)
- ✅ Списки (маркированные, нумерованные)
- ✅ Ссылки (в том числе якоря для навигации)
- ✅ Загрузка изображений (через API /api/media/upload)
- ✅ Изображения по URL
- ✅ **VIDEO EMBED** (YouTube, Vimeo, Rutube, VK, OK.ru) - кнопка "🎥 Видео"
- ✅ Markdown shortcuts (**bold**, *italic*, ## heading)
- ✅ HTML режим для прямого редактирования кода

#### Упражнения:
- ✅ Создание/редактирование через админку
- ✅ Карусель медиа-файлов с drag-and-drop
- ✅ Отметка выполнения (галочки сохраняются независимо для каждого дня)
- ✅ Премиум-контент (доступен только с подпиской)

#### Аутентификация и премиум:
- ✅ Регистрация/вход через JWT токен
- ✅ Оплата премиум-доступа (Альфа-банк)
- ✅ Отображение дней до окончания премиум
- ✅ Фото-дневник (30 дней бесплатно + 30 дней за оплату)

#### Админ-панель:
- ✅ Управление упражнениями
- ✅ Управление марафонами
- ✅ Управление тегами/категориями
- ✅ Просмотр заказов/платежей
- ✅ Медиабиблиотека

---

## 🐛 Известные проблемы (если есть)

### Решенные в этой версии:
- ✅ Галочки упражнений исчезали между днями - **ИСПРАВЛЕНО** (уникальный индекс с dayNumber)
- ✅ Иконки категорий не отображались - **ИСПРАВЛЕНО** (используем emoji string)
- ✅ Навигация всегда вела на /start - **ИСПРАВЛЕНО** (логика на основе даты начала)
- ✅ Мелкие заголовки во фронтенде - **ИСПРАВЛЕНО** (явные CSS стили)

### Остающиеся (минорные):
- ⚠️ GitHub Pages CDN cache - изменения могут задерживаться на 5-15 минут
- ⚠️ MongoDB индекс для старых данных - нужно запустить `npm run fix-index` на продакшене

---

## 📝 База данных

### Бэкап MongoDB (если нужен):
```bash
# Создание бэкапа
ssh root@37.252.20.170
mongodump --db=rejuvena --out=/root/mongo-backups/backup-2026-02-14-video-support

# Восстановление
mongorestore --db=rejuvena /root/mongo-backups/backup-2026-02-14-video-support/rejuvena
```

### Важные коллекции:
- `users` - пользователи
- `exercises` - упражнения
- `marathons` - марафоны
- `marathondays` - дни марафонов
- `marathonexerciseprogresses` - прогресс по упражнениям (ВАЖНО: имеет уникальный индекс с dayNumber)
- `marathonenrollments` - записи на марафоны
- `payments` - платежи
- `tags` - теги/категории

---

## 🔧 Полезные команды

### Backend (локально):
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena

# Запуск dev сервера
npm run dev  # http://localhost:9527

# Сборка
npm run build

# Сборка админки
cd admin-panel && npm run build && cd ..

# Миграции
npm run fix-index  # Исправить индекс для прогресса упражнений
npm run seed  # Создать суперадмина (seplitza@gmail.com / 1234back)
```

### Frontend (локально):
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Dev сервер
npm run dev  # http://localhost:3000
# или через PM2
pm2 start npm --name "rejuvena-web-dev" -- run dev

# Сборка и деплой
npm run build
npx gh-pages -d out -m "Deploy: description"
```

### Production:
```bash
# Backend логи
ssh root@37.252.20.170 "pm2 logs rejuvena-backend --lines 50"

# Рестарт backend
ssh root@37.252.20.170 "pm2 restart rejuvena-backend"

# Проверка статуса
ssh root@37.252.20.170 "pm2 list"

# Проверка MongoDB
ssh root@37.252.20.170 "mongosh mongodb://localhost:27017/rejuvena"
```

---

## 🧪 Тестирование после восстановления

### Backend:
1. ✅ Админ-панель доступна: https://api-rejuvena.duckdns.org/admin/
2. ✅ Логин работает: seplitza@gmail.com / 1234back
3. ✅ TipTap редактор загружается
4. ✅ Кнопка "🎥 Видео" присутствует
5. ✅ Можно вставить YouTube ссылку и она конвертируется в iframe
6. ✅ API эндпоинты отвечают:
   - GET /api/marathons/user/my-enrollments
   - GET /api/marathons/:id/day/:dayNumber
   - POST /api/marathons/:id/day/:dayNumber/exercise/:exerciseId/toggle

### Frontend:
1. ✅ Сайт открывается: https://seplitza.github.io/rejuvena/
2. ✅ Логин работает
3. ✅ Баннеры марафонов отображаются
4. ✅ Клик на баннер ведет на текущий день (после старта марафона)
5. ✅ Заголовки в описании дня отображаются крупно (H1 ~30px)
6. ✅ Видео из TipTap рендерится через iframe
7. ✅ Галочки упражнений сохраняются между днями

---

## 📞 Контакты для восстановления

**Разработчик:** GitHub Copilot AI  
**Дата создания бэкапа:** 14 февраля 2026 г.

**Серверы:**
- VPS IP: 37.252.20.170
- Domain: api-rejuvena.duckdns.org
- SSH: root@37.252.20.170

**Репозитории:**
- Backend: https://github.com/seplitza/backend-rejuvena
- Frontend: https://github.com/seplitza/rejuvena

---

## 🔐 Переменные окружения (.env)

### Backend (.env):
```bash
PORT=9527
MONGODB_URI=mongodb://localhost:27017/rejuvena
JWT_SECRET=<your-secret-key>

# Alfabank
ALFABANK_USERNAME=<username>
ALFABANK_PASSWORD=<password>
ALFABANK_RETURN_URL=https://seplitza.github.io/rejuvena/payment-result

# Resend (Email)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@mail.seplitza.ru

# CORS
CORS_ORIGIN=https://seplitza.github.io,http://localhost:3000
```

### Frontend (в коде):
```typescript
// web/src/config/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://37.252.20.170:9527';
```

---

## ✨ Changelog (изменения в этой версии)

### Добавлено:
- 🎥 Поддержка видео в TipTap редакторе (YouTube, Vimeo, Rutube, VK, OK.ru)
- 🧭 Умная навигация по марафонам (на текущий день)
- 📊 Обновление lastAccessedDay при просмотре дня
- 🎨 Явные CSS стили для заголовков (H1/H2/H3)

### Исправлено:
- 🐛 Галочки упражнений теперь независимые для каждого дня
- 🐛 Иконки категорий отображаются (emoji)
- 🐛 Навигация не застревает на странице /start

### Технические улучшения:
- Уникальный индекс MongoDB: `{ userId, marathonId, dayNumber, exerciseId }`
- Миграционный скрипт: `npm run fix-index`
- Отката автомиграции при старте сервера (вызывала краши)

---

**🔄 Для восстановления этой версии используйте команды из раздела "Инструкции по восстановлению"**

**📌 Следующая точка восстановления должна быть создана после следующих major изменений**
