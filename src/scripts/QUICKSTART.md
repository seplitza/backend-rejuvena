# 🚀 Быстрый старт: Импорт английских упражнений

## 📝 Что нужно сделать

### Шаг 1: Найти marathonId
**⭐ САМЫЙ ПРОСТОЙ СПОСОБ:**
1. Откройте https://seplitza.github.io/Rejuvena_old_app/courses
2. F12 → Console (консоль)
3. Найдите лог `📦 Full orders from backend:` или `Order #X:`
4. Скопируйте `id` нужного курса - это и есть **marathonId**!

**Готовые marathonId английских курсов:**
```
Look Younger (Basic)                    → 8ae4db8b-b256-462a-8918-7e7811243d64
+Advanced for the Neck                  → fc62d140-17af-4c61-be90-63a6cc656a7b
+Advanced for The Forehead and Eyes     → 3c33c808-523c-4e60-b284-139e2a136544
+Advanced for Mid-face and Eyes         → e7ce939d-b84a-4816-b5bf-ed347646f943
1 goal. Slow down aging                 → 3efe72d6-aea6-489d-9208-4eaa8979fbd3
```

### Шаг 2: Получить dayId
**Вариант А:** Через браузер (DevTools)
1. F12 → Network
2. Перейдите на нужный день курса
3. Найдите запрос `getdayexercise`
4. Скопируйте `dayId` из Query String Parameters

**Вариант Б:** Через скрипт:
```typescript
// В консоли Node.js или в скрипте
const response = await axios.get(`${OLD_API_URL}/usermarathon/getmarathon`, {
  params: { marathonId: 'ВАШ_MARATHON_ID' },
  headers: {
    'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
    'UserLanguage': 'en'
  }
});
console.log(response.data.marathon.marathonDays);
// Скопируйте dayId нужного дня
```

### Шаг 3: Скопировать шаблон скрипта
```bash
cp import-english-exercises-template.ts import-YOUR-COURSE-en.ts
```

### Шаг 4: Настроить скрипт
Откройте `import-YOUR-COURSE-en.ts` и заполните:

```typescript
const MARATHON_ID = 'ваш_marathon_id';  // Из шага 1
const DAY_ID = 'ваш_day_id';            // Из шага 2
const COURSE_NAME = 'Advanced Neck';    // Название курса
const CATEGORY_SEARCH = 'advanced';     // Часть названия категории

// Теги для упражнений
const tagNames = ['Advanced', 'Neck', 'PRO']; // Настройте под свой курс
```

### Шаг 5: Запустить импорт
```bash
npx ts-node import-YOUR-COURSE-en.ts
```

### Шаг 6: Связать с русскими упражнениями (опционально)
```bash
npx ts-node link-en-ru-exercises.ts
```

Скрипт создаст файл `exercise-links-export.json` со всеми предложенными связями.

---

## 📂 Созданные файлы

1. **utils/en-tag.ts** - Утилита для тега EN ✅
2. **import-english-exercises-template.ts** - Шаблон скрипта импорта ✅
3. **find-marathon-ids.ts** - Поиск marathonId ✅
4. **link-en-ru-exercises.ts** - Связывание EN↔RU упражнений ✅
5. **IMPORT_EN_EXERCISES_GUIDE.md** - Полная инструкция ✅
6. **QUICKSTART.md** - Эта шпаргалка ✅

---

## ⚙️ Проверка импорта

```bash
# Проверить все упражнения
npx ts-node check-all-exercises.ts

# Проверить теги
npx ts-node check-tags.ts
```

---

## 🔑 Ключевые отличия от русского импорта

| Параметр | Русский | Английский |
|----------|---------|------------|
| UserLanguage | `'ru'` | `'en'` ✅ |
| Тег | RU (getRuTag) | EN (getEnTag) ✅ |
| Цвет тегов | `#3B82F6` (синий) | `#10B981` (зеленый) ✅ |

---

## 💡 Полезные команды

```bash
# Проверить .env файл
cat .env | grep OLD_API_TOKEN

# Список всех скриптов импорта
ls -la import-*.ts

# Удалить упражнения с тегом (осторожно!)
# npx ts-node remove-exercises-by-tag.ts EN
```

---

## 📞 Помощь

- **Полная инструкция**: [IMPORT_EN_EXERCISES_GUIDE.md](IMPORT_EN_EXERCISES_GUIDE.md)
- **Модель Exercise**: `src/models/Exercise.model.ts`
- **Пример импорта RU**: `import-lips-jaw-pro.ts`
