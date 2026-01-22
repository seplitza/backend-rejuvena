# 🎓 Восстановление курсов со старого Azure API

## Архитектура версии 1.0

В версии 1.0 использовалась **Dual Backend** конфигурация:

```
Frontend (seplitza.github.io/rejuvena/)
    ├─ Логин/регистрация → Azure API ✅
    ├─ Курсы → Azure API ✅
    └─ Упражнения → Новый API (api-rejuvena.duckdns.org) ✅
```

**Курсы работают БЕЗ изменений backend** - frontend напрямую обращается к Azure.

## Azure API Endpoints

```
Base URL: https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api

Auth:
  POST /token/login - Логин (возвращает JWT token)
  
Courses:
  GET /order/getuserorders - Мои курсы
  GET /marathon/GetMarathonsGuestUser?languageCulture=ru-RU - Доступные курсы
  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathon/  GET /maat  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathexercise?marathonId=X&dayId=Y&timeZoneOffset=-1  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathon/  GET /marathon/  GET /marercises  GET /marathon/  GET /marathon/  eId, status }
  
Orders:
  POST /Order/CreateOrder { marathonId: X, couponCode: null }
```

## Frontend конфигурация

**Файл: `web/src/config/api.ts`**

```typescript
// OLD Backend (Azure) - для логина и курсов
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://new-facelift-service-b8cta5hpgcgqf8c  'https://new-facelift-service-b8cta5hpgcgqf8c  'https://new-facelift-service-b8cta5hажне�  'https://new-facelift-service-b8cta5hpgcgqf8c  'https://newAPI_URL || 
  'https://api-rejuvena.duckdns.org';
```

**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�IC**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�IC**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�IC**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�IC**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай�**Фай.0-stable
npmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnpmnprses fronpmnpmnpmnpmnpmnpmnpmnpmnp
Через 5-10 минут курсы заработают на https://seplitza.github.io/rejuvena/courses

### Вариант 2: Копирование файлов курсов

Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е�Е
�# Сохранить текущие изменения
git stash

# Взять только файлы курсов из v1.1.0
git checkout v1.1.0-stable -- src/pages/courses.tsx
git checkout v1.1.0-stable -- src/store/modules/courses/
git checkout v1.1.0-stable -- src/api/endpoints.ts
git checkout v1.1.0-stable -- src/config/api.ts
git checkout v1.1.0-stable -- .env.production

# Вернуть остальное
git stash pop

# Деплой
npm run build && npx gh-pages -d out
```

## Что НЕ нужно менять## Что НЕ нужно менять## Что НЕ нужно менять## Что НЕ ну��## Что НЕ нужно менять## Что НЕ нужно менять## Что НЕ нужно ме с## Что НЕ нужно менять## Что НЕ нужно мбот## Что НЕ нужно менять## Что НЕ нужно менять## Что НЕ нужно менять## Что НЕ ну��## Что НЕ нужно менять## Что НЕ нужно менять## 
�****************************************************�в�********
```
GET https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.GET https://new-facelift-service-b8cta5hpgcgqf8c7.ation: Bearer <token>
```

## Файлы frontend для к## Файлы frontend для к## Файлы�ан�## Файлы frontend для к## Файлы od## Файлы frontend для к## Фай�c/sto## Файлы frontend для �API �## Файл�- `src/api/endpoin## Файлы frontend для к##nfig/api.ts` - API URLs

## Важно

- Курсы работают через **прямое подключение frontend → Azure**
- Backend не участвует в работе курсов
- Это временная схема (Strangler Fig Pattern)
- В будущем курсы можно мигрировать на новый backend
