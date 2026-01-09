# Стабильная конфигурация v1.1.0
**Дата**: 9 января 2026, 16:20
**Git Tag**: `v1.1.0-stable`

## ✅ Статус
- **Вход**: Работает ✅
- **Курсы**: Работают (старый бэкенд) ✅
- **Упражнения**: Загружаются (новый бэкенд) ✅
- **UI**: Бейджи, описания, модалка - всё работает ✅

## 🔄 Переходная конфигурация (Dual Backend)

### Frontend URLs
```
OLD Backend (Azure):
- URL: https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net
- Использование: Авторизация (логин), курсы
- Env var: NEXT_PUBLIC_API_URL

NEW Backend (DuckDNS):
- URL: https://api-rejuvena.duckdns.org
- Использование: Только упражнения
- Env var: NEXT_PUBLIC_NEW_API_URL
```

### Файл `.env.production`
```bash
# OLD Backend (Azure) - for auth and courses
NEXT_PUBLIC_API_URL=https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net

# NEW Backend (DuckDNS) - for exercises only
NEXT_PUBLIC_NEW_API_URL=https://api-rejuvena.duckdns.org
```

### Конфигурация API (`src/config/api.ts`)
```typescript
// OLD Backend - for auth and courses
export const API_URL = getOldApiUrl(); // Azure

// NEW Backend - for exercises
export const NEW_API_URL = getNewApiUrl(); // DuckDNS

export const API_ENDPOINTS = {
  exercises: {
    public: `${NEW_API_URL}/api/exercises/public`,  // Новый бэкенд
  },
  courses: {
    public: `${API_URL}/api/courses/public`,  // Старый бэкенд
  },
};
```

## 🎨 UI Features

### Бейджи упражнений
- 🟢 **"На здоровье"** - зеленый (бесплатные)
- 🔵 **"Базовое"** - синий (100₽)
- 🟣 **"PRO"** - фиолетовый (200₽)

### Модальное окно оплаты
- Фон: `bg-black/30` с блюром
- Заголовок: "Полный доступ" (всегда)
- Текст: "Доступ на 1 месяц!" (вместо "навсегда")

### Список упражнений
- Бейджи сверху упражнений
- Краткое описание под названием (до 100 символов)
- Сортировка: бесплатные → базовые → PRO
- Иконка замка для платных без доступа

## 📦 Деплой

### Frontend (GitHub Pages)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run build && npm run export
npx gh-pages -d out
```
URL: https://seplitza.github.io/rejuvena/

### Backend (Production Server)
- **IP**: 37.252.20.170
- **Domain**: api-rejuvena.duckdns.org
- **SSL**: Let's Encrypt (auto-renewal)
- **PM2**: backend-rejuvena
- **Admin Panel**: https://api-rejuvena.duckdns.org/admin/

## 🔙 Откат к этой версии

### Frontend
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git checkout v1.1.0-stable
npm run build && npm run export
npx gh-pages -d out
```

### Backend (если нужно)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git checkout v1.0.0-stable  # Бэкенд не менялся
```

## 📝 Последние коммиты
```
79f8d25 - Разделение API: старый Azure для логина/курсов, новый DuckDNS для упражнений
2f1d25d - Улучшения для модального окна и списка упражнений
7bc640e - Fix API URL: use HTTPS (api-rejuvena.duckdns.org)
```

## ⚠️ Важные замечания
1. Это **переходная конфигурация** - два бэкенда одновременно
2. Логин и курсы работают через старый Azure бэкенд
3. Упражнения загружаются с нового DuckDNS бэкенда
4. Такая конфигурация временная, на период разработки
5. В будущем нужно перевести всё на новый бэкенд

## 🎯 Тестирование
- ✅ Логин: https://seplitza.github.io/rejuvena/auth/login
- ✅ Упражнения: https://seplitza.github.io/rejuvena/exercises
- ✅ Курсы: https://seplitza.github.io/rejuvena/courses
- ✅ Админка: https://api-rejuvena.duckdns.org/admin/
