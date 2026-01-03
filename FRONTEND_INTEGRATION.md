# Frontend Integration Guide

## 🎯 Задача

Подключить фронтенд https://seplitza.github.io/rejuvena/exercises к новому API: https://api-rejuvena.duckdns.org

## 📍 Текущее состояние

- **Frontend:** Next.js (static export) на GitHub Pages
- **Репозиторий:** https://github.com/seplitza/rejuvena
- **Старый API:** https://api.faceliftnaturally.me
- **Статические данные:** `/src/data/exercisesData.generated.ts`

## 🔄 Шаги интеграции

### 1. Найти файл с API запросами

Искать файлы с названиями:
- `api.ts`, `request.ts`, `apiClient.ts`
- `config.ts`, `constants.ts`
- Или поиск по коду: `api.faceliftnaturally.me`

### 2. Обновить API URL

```typescript
// Было
const API_URL = 'https://api.faceliftnaturally.me';

// Стало
const API_URL = 'https://api-rejuvena.duckdns.org/api';
```

### 3. Обновить endpoint упражнений

```typescript
// Публичный endpoint (без авторизации)
const getExercises = async () => {
  const response = await fetch(`${API_URL}/exercises/public`);
  return response.json();
};

const getExerciseById = async (id: string) => {
  const response = await fetch(`${API_URL}/exercises/public/${id}`);
  return response.json();
};
```

### 4. Структура ответа API

```typescript
interface Exercise {
  _id: string;
  title: string;
  description: string;
  content: string; // HTML
  carouselMedia: Media[];
  tags: Tag[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Media {
  url: string;
  type: 'image' | 'video';
  filename: string;
  order: number;
  _id: string;
}

interface Tag {
  _id: string;
  name: string;
  slug: string;
  color: string;
}
```

### 5. Удалить статические данные (опционально)

Если больше не нужны:
```bash
rm src/data/exercisesData.generated.ts
```

### 6. Локальная проверка

```bash
cd web  # или путь к фронтенду
npm run dev
# Открыть http://localhost:3000
```

### 7. Deployment

```bash
npm run build
npm run export  # для статического сайта
npm run deploy  # deploy to GitHub Pages
```

## 🧪 Тестирование API

```bash
# Проверка доступности
curl https://api-rejuvena.duckdns.org/health

# Получить все упражнения
curl https://api-rejuvena.duckdns.org/api/exercises/public

# Получить одно упражнение
curl https://api-rejuvena.duckdns.org/api/exercises/public/[ID]
```

## ✅ Преимущества нового API

1. **Актуальные данные** - упражнения обновляются в админ-панели
2. **Производительность** - собственный сервер с SSL
3. **Полный контроль** - управление тегами, медиа, контентом
4. **Безопасность** - HTTPS + CORS настроен для GitHub Pages

## 🔍 Поиск файлов API в проекте

```bash
cd web
grep -r "api.faceliftnaturally" src/
grep -r "exercisesData" src/
grep -r "fetch.*exercise" src/
```

## 📝 Пример миграции

**Было:**
```typescript
import { exercises } from '@/data/exercisesData.generated';

export function getExercises() {
  return exercises;
}
```

**Стало:**
```typescript
const API_URL = 'https://api-rejuvena.duckdns.org/api';

export async function getExercises() {
  const response = await fetch(`${API_URL}/exercises/public`);
  return response.json();
}
```

## 🚨 CORS уже настроен

Backend уже разрешает запросы с:
- `https://seplitza.github.io`
- `http://localhost:3000`
- `http://localhost:5173`

Дополнительная настройка не требуется.

## 📞 Проблемы?

Если упражнения не загружаются:
1. Проверить консоль браузера на ошибки CORS
2. Убедиться что API работает: `curl https://api-rejuvena.duckdns.org/health`
3. Проверить что frontend использует правильный URL
4. Проверить что endpoint `/api/exercises/public` используется (не `/exercises`)
