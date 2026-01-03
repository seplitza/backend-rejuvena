# Rejuvena Backend + Admin Panel

Полнофункциональная система управления упражнениями для приложения Rejuvena.

## 📋 Возможности

### Backend API
- ✅ Аутентификация с JWT
- ✅ CRUD операции для упражнений
- ✅ Загрузка медиафайлов (изображения, видео)
- ✅ Система тегов для категоризации
- ✅ API для управления каруселью медиа

### Admin Panel
- ✅ Авторизация суперадмина
- ✅ Dashboard с статистикой
- ✅ Список упражнений с фильтрацией
- ✅ Rich Text редактор TipTap с поддержкой медиа
- ✅ Drag & Drop загрузка файлов
- ✅ Управление порядком медиа в карусели
- ✅ Система тегов
- ✅ Публикация/снятие с публикации

## 🚀 Быстрый старт

### 1. Установка зависимостей Backend

```bash
npm install
```

### 2. Установка зависимостей Admin Panel

```bash
cd admin-panel
npm install
cd ..
```

### 3. Запуск MongoDB

Убедитесь, что MongoDB запущена локально на порту 27017, или обновите `MONGODB_URI` в `.env`

```bash
# macOS (с Homebrew)
brew services start mongodb-community

# или запустите в Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Инициализация базы данных

```bash
npm run seed
```

Это создаст:
- Суперадмина (seplitza@gmail.com / 1234back)
- Базовые теги (Начинающий, Продвинутый, Эксперт, Йога, Пилатес, Растяжка)

### 5. Запуск Backend

```bash
npm run dev
```

Backend будет доступен на `http://localhost:5000`

### 6. Запуск Admin Panel

В новом терминале:

```bash
cd admin-panel
npm run dev
```

Admin Panel будет доступен на `http://localhost:5173`

## 🔐 Доступы

**Суперадмин:**
- Email: `seplitza@gmail.com`
- Пароль: `1234back`

## 📁 Структура проекта

```
Backend-rejuvena/
├── src/                      # Backend код
│   ├── models/               # Mongoose модели
│   │   ├── User.model.ts
│   │   ├── Exercise.model.ts
│   │   └── Tag.model.ts
│   ├── routes/               # API маршруты
│   │   ├── auth.routes.ts
│   │   ├── exercise.routes.ts
│   │   ├── media.routes.ts
│   │   └── tag.routes.ts
│   ├── middleware/           # Middleware
│   │   └── auth.middleware.ts
│   ├── scripts/              # Утилиты
│   │   └── seed.ts
│   └── server.ts             # Точка входа
├── admin-panel/              # Frontend админ-панель
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   │   ├── Layout.tsx
│   │   │   └── TipTapEditor.tsx
│   │   ├── pages/            # Страницы
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ExerciseList.tsx
│   │   │   └── ExerciseEditor.tsx
│   │   ├── api/              # API клиент
│   │   │   └── client.ts
│   │   ├── utils/            # Утилиты
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── uploads/                  # Загруженные файлы
├── .env                      # Переменные окружения
└── package.json
```

## 🛠️ API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Упражнения
- `GET /api/exercises` - Получить все упражнения
- `GET /api/exercises/:id` - Получить упражнение
- `POST /api/exercises` - Создать упражнение
- `PUT /api/exercises/:id` - Обновить упражнение
- `DELETE /api/exercises/:id` - Удалить упражнение
- `PUT /api/exercises/:id/carousel/reorder` - Изменить порядок медиа

### Медиа
- `POST /api/media/upload` - Загрузить файл
- `POST /api/media/upload-url` - Загрузить по URL
- `DELETE /api/media/:filename` - Удалить файл

### Теги
- `GET /api/tags` - Получить все теги
- `POST /api/tags` - Создать тег
- `DELETE /api/tags/:id` - Удалить тег

## 📦 Основные технологии

### Backend
- **Node.js** + **Express** - Сервер
- **TypeScript** - Типизация
- **MongoDB** + **Mongoose** - База данных
- **JWT** - Аутентификация
- **Multer** + **Sharp** - Загрузка и оптимизация изображений
- **Bcrypt** - Хеширование паролей

### Frontend (Admin Panel)
- **React 19** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **React Router** - Маршрутизация
- **TipTap** - Rich text редактор
- **React Beautiful DnD** - Drag & Drop
- **React Dropzone** - Загрузка файлов
- **Axios** - HTTP клиент

## 🎨 Особенности TipTap редактора

- ✅ Адаптивные изображения (автоматически подстраиваются под ширину)
- ✅ Поддержка видео
- ✅ Ссылки
- ✅ Форматирование текста (Bold, Italic, Headings)
- ✅ Списки (маркированные и нумерованные)
- ✅ Вставка медиа по URL
- ✅ HTML контент сохраняется в базе данных

## 🔄 Workflow использования

1. **Войдите** в админ-панель с учетными данными суперадмина
2. **Создайте теги** для категоризации упражнений
3. **Создайте упражнение:**
   - Заполните название и описание
   - Добавьте контент в TipTap редакторе
   - Загрузите медиа для карусели (файлами или по URL)
   - Измените порядок медиа drag & drop
   - Добавьте теги
   - Опубликуйте или сохраните как черновик
4. **Управляйте** списком упражнений через фильтры

## 🌐 Развертывание

### Backend
Рекомендуется использовать:
- **Heroku** / **Railway** / **Render** для хостинга
- **MongoDB Atlas** для базы данных
- **AWS S3** / **Cloudinary** для хранения медиа (в production)

### Admin Panel
- **Vercel** / **Netlify** - для статического хостинга
- Или встроить в backend как статические файлы

## 📝 TODO для продакшена

- [ ] Миграция с локального хранения файлов на S3/Cloudinary
- [ ] Добавить пагинацию для списка упражнений
- [ ] Добавить поиск упражнений
- [ ] Добавить роли (admin, editor, viewer)
- [ ] Добавить логирование действий
- [ ] Настроить CORS для production URL
- [ ] Добавить rate limiting
- [ ] Настроить CI/CD
- [ ] Добавить тесты

## 🤝 Связь с фронтенд приложением Rejuvena

Это backend API может быть использован фронтенд приложением Rejuvena для:
- Получения списка упражнений
- Отображения деталей упражнения
- Фильтрации по тегам
- Отображения карусели изображений

Пример интеграции:
```typescript
// В фронтенд приложении Rejuvena
const fetchExercises = async () => {
  const response = await fetch('https://your-backend-url/api/exercises');
  const exercises = await response.json();
  return exercises.filter(e => e.isPublished); // Только опубликованные
};
```

## 📄 Лицензия

MIT
