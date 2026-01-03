# Инструкции по развертыванию на GitHub Pages

> **Примечание:** GitHub Pages предназначен для статических сайтов. Backend API нужно развернуть отдельно на платформе типа Heroku, Railway, или Render.

## Структура репозиториев

Рекомендуется создать **2 отдельных репозитория**:

### 1. Backend API Repository
- Название: `backend-rejuvena`
- URL: `https://github.com/seplitza/backend-rejuvena`
- Содержимое: все кроме папки `admin-panel/`

### 2. Admin Panel Repository  
- Название: `admin-panel-rejuvena`
- URL: `https://github.com/seplitza/admin-panel-rejuvena`
- Содержимое: только папка `admin-panel/`

## Шаг 1: Инициализация Git

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena

# Инициализируем git
git init
git add .
git commit -m "Initial commit: Rejuvena Backend & Admin Panel"
```

## Шаг 2: Создание репозитория на GitHub

1. Зайдите на https://github.com/new
2. Создайте репозиторий `backend-rejuvena`
3. НЕ создавайте README, .gitignore (они уже есть)

```bash
# Подключаем remote
git remote add origin https://github.com/seplitza/backend-rejuvena.git
git branch -M main
git push -u origin main
```

## Шаг 3: Развертывание Backend API

Используйте одну из платформ:

### Вариант A: Railway (Рекомендуется)

1. Зайдите на https://railway.app
2. Подключите GitHub репозиторий
3. Добавьте MongoDB как сервис
4. Добавьте переменные окружения:
   ```
   MONGODB_URI=<Railway MongoDB URL>
   JWT_SECRET=<случайная строка>
   NODE_ENV=production
   ```
5. Railway автоматически развернет ваш backend

### Вариант B: Render

1. Зайдите на https://render.com
2. Создайте новый Web Service
3. Подключите репозиторий
4. Настройки:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Добавьте MongoDB Atlas и переменные окружения

### Вариант C: Heroku

```bash
# Установите Heroku CLI
brew install heroku/brew/heroku

# Логин
heroku login

# Создайте приложение
heroku create backend-rejuvena

# Добавьте MongoDB
heroku addons:create mongodb:sandbox

# Установите переменные
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Деплой
git push heroku main
```

## Шаг 4: Развертывание Admin Panel на GitHub Pages

```bash
cd admin-panel

# Обновите .env для продакшена
echo "VITE_API_URL=https://your-backend-url.com/api" > .env.production

# Билд для GitHub Pages
npm run build

# Установите gh-pages
npm install --save-dev gh-pages

# Добавьте в package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Деплой
npm run deploy
```

### Настройка GitHub Pages

1. Перейдите в Settings репозитория
2. Pages → Source → Deploy from a branch
3. Branch: `gh-pages` → Root
4. Сохраните

Админ-панель будет доступна по адресу:
`https://seplitza.github.io/admin-panel-rejuvena/`

## Шаг 5: Обновление CORS в Backend

После развертывания обновите [src/server.ts](src/server.ts):

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seplitza.github.io'
  ],
  credentials: true
}));
```

## Альтернатива: Один репозиторий

Если хотите держать все в одном репозитории:

1. Разверните backend на Railway/Render/Heroku
2. Соберите admin-panel локально: `cd admin-panel && npm run build`
3. Скопируйте `admin-panel/dist/` в `public/` в корне backend
4. В backend добавьте серверацию статики:

```typescript
// src/server.ts
app.use(express.static(path.join(__dirname, '../public')));

// Для React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

## База данных Production

Используйте MongoDB Atlas (бесплатный tier):

1. https://www.mongodb.com/cloud/atlas
2. Создайте бесплатный кластер
3. Получите connection string
4. Добавьте в переменные окружения хостинга

## Хранение медиафайлов

В production замените локальное хранилище на:

### Cloudinary (Рекомендуется)

```bash
npm install cloudinary
```

```typescript
// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});
```

### AWS S3

```bash
npm install @aws-sdk/client-s3
```

## Финальный чеклист

- [ ] Backend развернут на Railway/Render/Heroku
- [ ] MongoDB Atlas настроен и подключен
- [ ] Переменные окружения настроены
- [ ] Admin Panel собран и развернут
- [ ] CORS обновлен с правильными URL
- [ ] Cloudinary/S3 настроен для медиа
- [ ] Создан суперадмин через seed скрипт
- [ ] Проверен вход в админ-панель
- [ ] Протестировано создание упражнения

## Структура URL в production

- Backend API: `https://backend-rejuvena.up.railway.app/api`
- Admin Panel: `https://seplitza.github.io/admin-panel-rejuvena/`
- Frontend App: `https://seplitza.github.io/rejuvena/`

## Безопасность

Перед продакшеном:

1. Смените JWT_SECRET на случайную строку
2. Включите rate limiting
3. Добавьте helmet для security headers
4. Используйте HTTPS только
5. Ограничьте CORS только нужными доменами
