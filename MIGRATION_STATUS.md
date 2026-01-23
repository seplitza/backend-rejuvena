# 📊 Marathon Migration Status

## ✅ Что готово

### 1. Миграционная инфраструктура
- ✅ **migrate-marathons.ts** - Основной скрипт миграции (503 строки)
  - Скачивание данных из Azure API
  - Трансформация формата данных
  - Загрузка в новую систему
  - Сохранение бэкапов в JSON файлы
- ✅ **list-azure-marathons.ts** - Вспомогательный скрипт для получения списка марафонов
- ✅ API endpoint'ы проверены:
  - `POST /api/marathons/admin/:id/days` - Создание дня
  - `PUT /api/marathons/admin/:id/days/:dayId` - Обновление дня
  - `DELETE /api/marathons/admin/:id/days/:dayId` - Удаление дня

### 2. Документация
- ✅ **MARATHON_MIGRATION_GUIDE.md** - Полная инструкция по использованию
- ✅ **GET_MARATHON_IDS.md** - Инструкция по получению ID марафонов
- ✅ **marathon-config.json** - Шаблон конфигурации

### 3. Текущая конфигурация
```typescript
// В migrate-marathons.ts уже настроено:
const AZURE_MARATHONS = [
  ['3842e63f-b125-447d-94a1-b1c93be38b4e', 'Омолодись', 14],
  // TODO: Add remaining 9 marathons
];

const MARATHON_ID_MAPPING = {
  '3842e63f-b125-447d-94a1-b1c93be38b4e': '696fab9cd2a8c56f62ebdb09', // Омолодись → Тестовый марафон оплаты
  // TODO: Add remaining 9 mappings
};
```

### 4. Найдено в новой базе данных
```
MongoDB: mongodb://localhost:27017/rejuvena
Collection: marathons

Существующий марафон:
- ID: 696fab9cd2a8c56f62ebdb09
- Название: "Тестовый марафон оплаты"
- Дней: 7
- Язык: ru
```

## ⏳ Что нужно сделать

### Шаг 1: Получить ID всех 10 марафонов из Azure
**Метод**: Browser Network Inspection (подробно в [GET_MARATHON_IDS.md](GET_MARATHON_IDS.md))

1. Открыть: https://seplitza.github.io/Rejuvena_old_app/
2. Войти: seplitza@gmail.com / 1234
3. DevTools → Network → Fetch/XHR
4. Кликать по каждому марафону
5. Копировать `marathonId` из запроса `startmarathon?marathonId=XXX`

**Нужна таблица:**
| # | Название | Azure ID | Дней |
|---|----------|----------|------|
| 1 | Омолодись | `3842e63f-...` ✅ | 14 |
| 2 | ??? | ??? | ??? |
| 3 | ??? | ??? | ??? |
| 4 | ??? | ??? | ??? |
| 5 | ??? | ??? | ??? |
| 6 | ??? | ??? | ??? |
| 7 | ??? | ??? | ??? |
| 8 | ??? | ??? | ??? |
| 9 | ??? | ??? | ??? |
| 10 | ??? | ??? | ??? |

### Шаг 2: Создать 9 марафонов в новой админке
**Где**: http://37.252.20.170:9527/admin/ (или http://localhost:9527/admin/ в dev)

Для каждого Azure марафона:
1. Открыть новую админку
2. Создать марафон с таким же названием
3. Указать `numberOfDays` (количество дней из Azure)
4. Указать язык: `ru`
5. Скопировать MongoDB `_id` созданного марафона

**Получить MongoDB ID:**
```bash
# После создания каждого марафона:
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/rejuvena').then(async () => { const Marathon = mongoose.model('Marathon', new mongoose.Schema({}, { strict: false })); const marathons = await Marathon.find({}).select('_id title numberOfDays').lean(); console.log(JSON.stringify(marathons, null, 2)); process.exit(0); });"
```

### Шаг 3: Обновить конфигурацию в migrate-marathons.ts
Добавить все 10 марафонов в массивы:
```typescript
const AZURE_MARATHONS = [
  ['3842e63f-b125-447d-94a1-b1c93be38b4e', 'Омолодись', 14],
  ['AZURE_ID_2', 'Название марафона 2', 14],
  ['AZURE_ID_3', 'Название марафона 3', 14],
  // ... все 10 марафонов
] as const;

const MARATHON_ID_MAPPING: Record<string, string> = {
  '3842e63f-b125-447d-94a1-b1c93be38b4e': '696fab9cd2a8c56f62ebdb09',
  'AZURE_ID_2': 'NEW_MONGO_ID_2',
  'AZURE_ID_3': 'NEW_MONGO_ID_3',
  // ... все 10 маппингов
};
```

### Шаг 4: Тестовая миграция (только скачивание)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
npx ts-node src/scripts/migrate-marathons.ts download-only
```

**Проверить:**
- Папка `marathon-migration-data/` создалась
- Внутри есть JSON файлы для каждого марафона
- В файлах есть данные дней с категориями и упражнениями

### Шаг 5: Полная миграция
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
npx ts-node src/scripts/migrate-marathons.ts
```

**Проверить после миграции:**
1. В новой админке открыть каждый марафон
2. Убедиться что созданы все 14 дней
3. Проверить что у каждого дня есть упражнения
4. Открыть несколько упражнений - проверить контент и медиа

## 📋 Быстрые команды

```bash
# Проверить текущую конфигурацию
npx ts-node src/scripts/migrate-marathons.ts list-marathons

# Получить список марафонов из Azure (API метод - не работает для продакшн)
npx ts-node src/scripts/list-azure-marathons.ts

# Только скачать данные (тест)
npx ts-node src/scripts/migrate-marathons.ts download-only

# Полная миграция
npx ts-node src/scripts/migrate-marathons.ts

# Проверить марафоны в MongoDB
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/rejuvena').then(async () => { const Marathon = mongoose.model('Marathon', new mongoose.Schema({}, { strict: false })); const marathons = await Marathon.find({}).select('_id title numberOfDays').lean(); console.log(JSON.stringify(marathons, null, 2)); process.exit(0); });"
```

## 🔧 Технические детали

### API Endpoints

**Azure Old API:**
- Base: `https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net`
- Auth: POST `/api/token/auth`
- Start: GET `/api/usermarathon/startmarathon?marathonId=XXX`
- Day: GET `/api/usermarathon/getdayexercise?dayId=XXX`

**New API:**
- Base: `http://localhost:9527` (dev) or `http://37.252.20.170:9527` (prod)
- Auth: POST `/api/auth/login`
- Create Day: POST `/api/marathons/admin/:marathonId/days`
- Update Day: PUT `/api/marathons/admin/:marathonId/days/:dayId`

### Data Transformation
```typescript
// Azure format
{
  marathonDay: {
    description: "Welcome message",
    dayCategories: [{
      categoryName: "Category 1",
      categoryOrder: 1,
      exercises: [{
        exerciseName: "Exercise 1",
        order: 1,
        description: "...",
        exerciseContents: [{
          mediaUrl: "https://...",
          order: 1
        }]
      }]
    }]
  }
}

// New API format
{
  welcomeMessage: "Welcome message",
  exercises: [{
    categoryName: "Category 1",
    exerciseName: "Exercise 1",
    description: "...",
    order: 1,
    media: [{
      type: "image" | "video",
      url: "https://...",
      order: 1
    }]
  }]
}
```

## 📝 Примечания

- Скрипт автоматически сохраняет бэкапы в `marathon-migration-data/`
- Между запросами есть задержки (500ms между днями, 2s между марафонами)
- Ошибки не останавливают миграцию - она продолжит со следующего дня
- Все логи выводятся в консоль с эмодзи для удобства
- После миграции можно удалить дни через DELETE endpoint если что-то пошло не так

## ⚠️ Важно

1. **Сначала скачайте** данные в `download-only` режиме - это создаст бэкапы
2. **Проверьте** бэкапы перед полной миграцией
3. **Убедитесь** что все 10 марафонов созданы в новой админке
4. **Проверьте** что все маппинги правильные в конфигурации
5. **Коммитьте** изменения в Git перед каждым важным шагом

## 🎯 Следующий шаг

**СЕЙЧАС НУЖНО:** Собрать ID всех 10 марафонов из старого приложения через browser метод.

См. инструкцию: [GET_MARATHON_IDS.md](GET_MARATHON_IDS.md)
