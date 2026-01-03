# Rejuvena Backend & Admin Panel

> Полнофункциональная система управления контентом для приложения Rejuvena

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5+-green.svg)](https://www.mongodb.com/)

## 🚀 Быстрый старт

```bash
# 1. Запустите MongoDB
brew services start mongodb-community

# 2. Установите зависимости (если еще не установлены)
npm install
cd admin-panel && npm install && cd ..

# 3. Создайте суперадмина
npm run seed

# 4. Запустите backend
npm run dev

# 5. В новом терминале - admin panel
cd admin-panel && npm run dev
```

**Откройте:** http://localhost:5173  
**Войдите:** seplitza@gmail.com / 1234back

📚 **Полная инструкция:** [QUICKSTART.md](QUICKSTART.md)

## ✨ Возможности

### Backend API
- ✅ JWT аутентификация
- ✅ CRUD операции для упражнений
- ✅ Загрузка и оптимизация медиафайлов
- ✅ Система тегов для категоризации
- ✅ RESTful API

### Admin Panel
- ✅ Современный интерфейс
- ✅ Rich Text редактор (TipTap)
- ✅ Drag & Drop загрузка файлов
- ✅ Сортировка медиа в карусели
- ✅ Управление тегами
- ✅ Публикация/черновики

## 📋 Технологии

**Backend:** Node.js • Express • TypeScript • MongoDB • JWT • Multer • Sharp

**Frontend:** React • TypeScript • Vite • TipTap • dnd-kit • React Router • Axios

## 📁 Структура

```
Backend-rejuvena/
├── src/              # Backend API
│   ├── models/       # MongoDB модели
│   ├── routes/       # API endpoints
│   ├── middleware/   # Аутентификация
│   └── server.ts     # Точка входа
├── admin-panel/      # React админ-панель
│   └── src/
│       ├── pages/    # Страницы
│       └── components/ # Компоненты
└── uploads/          # Медиафайлы
```

## 🔑 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Логин
- `GET /api/auth/me` - Текущий пользователь

### Упражнения
- `GET /api/exercises` - Список упражнений
- `POST /api/exercises` - Создать упражнение
- `GET /api/exercises/:id` - Получить упражнение
- `PUT /api/exercises/:id` - Обновить упражнение
- `DELETE /api/exercises/:id` - Удалить упражнение

### Медиа
- `POST /api/media/upload` - Загрузить файл
- `POST /api/media/upload-url` - Загрузить по URL
- `DELETE /api/media/:filename` - Удалить файл

### Теги
- `GET /api/tags` - Получить теги
- `POST /api/tags` - Создать тег
- `DELETE /api/tags/:id` - Удалить тег

## 📚 Документация

- **[QUICKSTART.md](QUICKSTART.md)** - Быстрый старт (начните здесь!)
- **[SETUP.md](SETUP.md)** - Подробная документация
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Развертывание в продакшн
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Полное описание проекта

## 🔧 Интеграция с Rejuvena App

```javascript
// В вашем фронтенд приложении
const API_URL = 'https://your-backend-url.com/api';

// Получить упражнения
const exercises = await fetch(`${API_URL}/exercises`)
  .then(res => res.json())
  .then(data => data.filter(e => e.isPublished));

// Получить упражнение
const exercise = await fetch(`${API_URL}/exercises/${id}`)
  .then(res => res.json());
```

## 🌐 Развертывание

**Backend:** Railway, Render, Heroku  
**Admin Panel:** GitHub Pages, Vercel, Netlify  
**Database:** MongoDB Atlas

Подробности в [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎯 Roadmap

- [ ] Роли и права доступа (admin, editor, viewer)
- [ ] Пагинация списка упражнений
- [ ] Поиск по упражнениям
- [ ] Версионирование упражнений
- [ ] Аналитика и статистика
- [ ] Миграция на S3/Cloudinary для медиа
- [ ] GraphQL API
- [ ] Unit/Integration тесты

## 📝 Лицензия

MIT

## 🤝 Контакты

- **Email:** seplitza@gmail.com
- **Frontend App:** https://seplitza.github.io/rejuvena
- **Backend:** https://github.com/seplitza/backend-rejuvena

---

**Сделано с ❤️ для Rejuvena**
