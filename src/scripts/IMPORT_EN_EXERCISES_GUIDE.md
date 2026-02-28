# 📘 Инструкция по импорту английских упражнений из OLD APP

## 🎯 Цель
Импортировать упражнения на **английском языке** из старого приложения и связать их с русскими аналогами.

---

## 📍 Шаг 1: Получение данных из OLD APP API

### API Endpoint
```
https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api/usermarathon/getdayexercise
```

### Параметры запроса
- **marathonId** - ID марафона/курса (UUID)
- **dayId** - ID дня (UUID)
- **timeZoneOffset** - смещение часового пояса (например, `-180`)

### Заголовки
- **Authorization**: `Bearer ${process.env.OLD_API_TOKEN}` - токен из .env файла
- **UserLanguage**: `'en'` - **ВАЖНО!** Для английских упражнений ставим `'en'`

### Как найти marathonId и dayId?

#### ⭐ Вариант 1: Через консоль браузера (САМЫЙ ПРОСТОЙ!)
1. Откройте старое приложение в браузере (https://seplitza.github.io/Rejuvena_old_app/courses)
2. Откройте DevTools (F12) → вкладка **Console**
3. Найдите лог `📦 Full orders from backend:` или `Order #X:`
4. Раскройте нужный курс и скопируйте поле **`id`** - это и есть **marathonId**!

**Пример из консоли:**
```javascript
Order #8: {
  id: 'fc62d140-17af-4c61-be90-63a6cc656a7b',  // ← ЭТО marathonId!
  title: '+Advanced for the Neck',
  languageCulture: 'en'  // ← Язык курса
}
```

**Английские курсы из вашего списка:**
- `8ae4db8b-b256-462a-8918-7e7811243d64` - "Look Younger" (Basic course) - **базовый курс**
- `fc62d140-17af-4c61-be90-63a6cc656a7b` - "+Advanced for the Neck" - **на шею**
- `3c33c808-523c-4e60-b284-139e2a136544` - "+Advanced for The Forehead and Eyes" - **на лоб и глаза**
- `e7ce939d-b84a-4816-b5bf-ed347646f943` - "+Advanced for Mid-face and Eyes" - **на щеки и глаза**
- `3efe72d6-aea6-489d-9208-4eaa8979fbd3` - "1 goal. Slow down aging"

#### Вариант 2: Найти dayId через Network
1. В DevTools откройте вкладку **Network**
2. Перейдите на нужный день курса в приложении
3. Найдите запрос к `/usermarathon/getdayexercise`
4. Скопируйте `dayId` из параметров запроса

#### Вариант 3: Через API список марафонов
```bash
# Получить список всех марафонов
curl -X GET "https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api/usermarathon/startmarathons" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "UserLanguage: en"
```

#### Вариант 4: Через скрипт find-marathon-ids.ts
```bash
cd Backend-rejuvena/src/scripts
npx ts-node find-marathon-ids.ts
```

### 📋 Таблица marathonId для курсов:

| Курс | marathonId | Язык |
|------|-----------|------|
| **РУССКИЕ КУРСЫ** |||
| +на губы и челюсть | `b9a10637-8b1e-478d-940c-4d239e53831e` | RU |
| +на шею | `b8775841-7b7d-43ca-b556-a9ce74d339cf` | RU |
| +на лоб и глаза | `11e5f1f2-de4e-4833-a7e5-3089c40be78f` | RU |
| +на щеки и глаза | `b87370d5-4ce1-49b2-86f4-23deb9a99123` | RU |
| Омолодись | `3842e63f-b125-447d-94a1-b1c93be38b4e` | RU |
| **АНГЛИЙСКИЕ КУРСЫ** |||
| Look Younger (Basic) | `8ae4db8b-b256-462a-8918-7e7811243d64` | EN |
| +Advanced for the Neck | `fc62d140-17af-4c61-be90-63a6cc656a7b` | EN |
| +Advanced for The Forehead and Eyes | `3c33c808-523c-4e60-b284-139e2a136544` | EN |
| +Advanced for Mid-face and Eyes | `e7ce939d-b84a-4816-b5bf-ed347646f943` | EN |
| 1 goal. Slow down aging | `3efe72d6-aea6-489d-9208-4eaa8979fbd3` | EN |

---

## 📍 Шаг 2: Создание скрипта импорта

### Пример: import-advanced-neck-en.ts

```typescript
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import { getEnTag } from './utils/en-tag'; // ✅ Используем EN тег!

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';

// Курс "+Advanced for the Neck" (EN)
const MARATHON_ID = 'ВАШЕ_MARATHON_ID'; // <-- Заполнить!
const DAY_ID = 'ВАШЕ_DAY_ID'; // <-- Заполнить!

async function importAdvancedNeckEN() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    console.log('📡 Запрашиваем данные из API...');
    
    const response = await axios.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
      params: {
        marathonId: MARATHON_ID,
        dayId: DAY_ID,
        timeZoneOffset: -180
      },
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'en' // ✅ Английский язык!
      }
    });

    const dayCategories = response.data.marathonDay?.dayCategories || [];
    console.log(`📦 Получено категорий: ${dayCategories.length}`);
    
    // Показываем доступные категории
    console.log('\nДоступные категории:');
    dayCategories.forEach((cat: any) => console.log(`  - ${cat.categoryName}`));

    // ✅ Ищем нужную категорию (настройте под свой курс!)
    const targetCategory = dayCategories.find((cat: any) => 
      cat.categoryName.toLowerCase().includes('advanced')
    );

    if (!targetCategory) {
      console.log('❌ Категория не найдена');
      return;
    }

    console.log(`\n📂 Категория: ${targetCategory.categoryName} (${targetCategory.exercises.length} упражнений)\n`);

    // ✅ Создаем теги
    const enTag = await getEnTag(); // Тег EN (скрытый)
    const tagNames = ['Advanced', 'Neck', 'PRO']; // Настройте под свой курс
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await Tag.findOne({ name });
        if (!tag) {
          tag = await Tag.create({ 
            name, 
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            color: '#10B981' // Зеленый для EN
          });
          console.log(`✅ Создан тег: #${name}`);
        }
        return tag;
      })
    );
    tags.push(enTag);

    let imported = 0;
    let skipped = 0;

    // ✅ Импортируем упражнения
    for (const oldExercise of targetCategory.exercises) {
      const exerciseName = oldExercise.exerciseName;
      
      try {
        // Проверяем существование по названию
        let exercise = await Exercise.findOne({ title: exerciseName });

        if (exercise) {
          console.log(`⏭️  Пропущено (уже существует): ${exerciseName}`);
          skipped++;
          continue;
        }

        // Конвертируем медиа
        const carouselMedia = (oldExercise.exerciseContents || [])
          .filter((content: any) => content.isActive)
          .sort((a: any, b: any) => a.order - b.order)
          .map((content: any) => {
            const url = content.contentPath || '';
            const filename = url.split('/').pop() || `${content.type}-${content.order}`;
            
            return {
              type: content.type === 'video' ? 'video' : 'image',
              url: url,
              filename: filename,
              order: content.order
            };
          });

        // ✅ Создаем упражнение
        exercise = await Exercise.create({
          title: exerciseName,
          description: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
          content: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
          carouselMedia: carouselMedia,
          tags: tags.map(tag => tag._id),
          duration: oldExercise.marathonExerciseName || '',
          order: oldExercise.order || 0,
          category: targetCategory.categoryName
        });
        
        console.log(`✅ Импортировано: ${exerciseName} (${carouselMedia.length} медиа)`);
        imported++;
      } catch (error: any) {
        console.error(`❌ Ошибка при обработке "${exerciseName}":`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Результаты импорта:');
    console.log(`✅ Импортировано: ${imported}`);
    console.log(`⏭️  Пропущено: ${skipped}`);
    console.log(`📦 Всего: ${imported + skipped}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Отключено от MongoDB');
  }
}

importAdvancedNeckEN();
```

---

## 📍 Шаг 3: Связывание английских и русских упражнений

### Вариант 1: Через поле `relatedExercises` (если есть в модели)

Если в модели Exercise есть поле `relatedExercises`, можно создать связи:

```typescript
// После импорта английских упражнений
const enExercise = await Exercise.findOne({ title: 'Neck Lift EN', tags: enTag._id });
const ruExercise = await Exercise.findOne({ title: 'Подъем шеи', tags: ruTag._id });

if (enExercise && ruExercise) {
  enExercise.relatedExercises = [ruExercise._id];
  ruExercise.relatedExercises = [enExercise._id];
  
  await enExercise.save();
  await ruExercise.save();
  
  console.log(`🔗 Связаны: "${enExercise.title}" ↔ "${ruExercise.title}"`);
}
```

### Вариант 2: Через скрипт автоматической связи по похожести

Создайте скрипт `link-en-ru-exercises.ts`:

```typescript
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import { getEnTag } from './utils/en-tag';
import { getRuTag } from './utils/ru-tag';

async function linkEnRuExercises() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const enTag = await getEnTag();
  const ruTag = await getRuTag();

  // Получаем все английские упражнения
  const enExercises = await Exercise.find({ tags: enTag._id });
  // Получаем все русские упражнения
  const ruExercises = await Exercise.find({ tags: ruTag._id });

  console.log(`🔍 Найдено EN: ${enExercises.length}, RU: ${ruExercises.length}`);

  let linked = 0;

  for (const enEx of enExercises) {
    // Ищем русский аналог по общим тегам
    const enExTags = enEx.tags.map(t => t.toString());
    
    for (const ruEx of ruExercises) {
      const ruExTags = ruEx.tags.map(t => t.toString());
      
      // Проверяем количество общих тегов (кроме EN/RU)
      const commonTags = enExTags.filter(tag => 
        ruExTags.includes(tag) && 
        tag !== enTag._id.toString() && 
        tag !== ruTag._id.toString()
      );

      // Если есть 2+ общих тега - вероятно это аналоги
      if (commonTags.length >= 2) {
        console.log(`\n🔗 Потенциальная связь:`);
        console.log(`   EN: ${enEx.title}`);
        console.log(`   RU: ${ruEx.title}`);
        console.log(`   Общих тегов: ${commonTags.length}`);
        
        // Здесь можно добавить связь
        linked++;
      }
    }
  }

  console.log(`\n✅ Найдено потенциальных связей: ${linked}`);
  await mongoose.connection.close();
}

linkEnRuExercises();
```

### Вариант 3: Ручное связывание через таблицу

Создайте CSV файл с соответствиями:

```csv
en_title,ru_title
"Neck Lift","Подъем шеи"
"Face Massage","Массаж лица"
```

И импортируйте его:

```typescript
import fs from 'fs';
import csv from 'csv-parser';

async function importLinksFromCSV() {
  const links: any[] = [];
  
  fs.createReadStream('exercise-links.csv')
    .pipe(csv())
    .on('data', (row) => links.push(row))
    .on('end', async () => {
      for (const link of links) {
        const enEx = await Exercise.findOne({ title: link.en_title });
        const ruEx = await Exercise.findOne({ title: link.ru_title });
        
        if (enEx && ruEx) {
          // Добавить связь
          console.log(`🔗 ${link.en_title} ↔ ${link.ru_title}`);
        }
      }
    });
}
```

---

## 🚀 Запуск скрипта

```bash
cd Backend-rejuvena/src/scripts

# 1. Убедитесь что .env файл содержит OLD_API_TOKEN
echo "Проверьте .env файл"

# 2. Запустите скрипт импорта
npx ts-node import-advanced-neck-en.ts

# 3. Проверьте результаты
npx ts-node check-all-exercises.ts
```

---

## ✅ Чеклист

- [ ] Получен `marathonId` для английского курса
- [ ] Получен `dayId` для нужного дня
- [ ] Создан файл `utils/en-tag.ts` с функцией `getEnTag()`
- [ ] Создан скрипт импорта (например, `import-advanced-neck-en.ts`)
- [ ] В скрипте используется `UserLanguage: 'en'`
- [ ] В скрипте используется `getEnTag()` вместо `getRuTag()`
- [ ] Скрипт успешно запущен и импортированы упражнения
- [ ] Упражнения имеют тег `EN`
- [ ] (Опционально) Создана связь между EN и RU упражнениями

---

## 📝 Примечания

1. **Важно!** Всегда ставьте `UserLanguage: 'en'` для английских упражнений
2. Тег `EN` должен быть **скрытым** (`isVisible: false`)
3. Связывание упражнений можно делать позже, когда будет готов UI для этого
4. Проверяйте дубликаты по названию упражнения
5. Сохраняйте `marathonId` и `dayId` в комментариях скрипта для документации

---

## 🔗 Полезные ссылки

- **Модель Exercise**: `src/models/Exercise.model.ts`
- **Модель Tag**: `src/models/Tag.model.ts`
- **Пример импорта RU**: `src/scripts/import-lips-jaw-pro.ts`
- **Утилита RU тега**: `src/scripts/utils/ru-tag.ts`
- **Утилита EN тега**: `src/scripts/utils/en-tag.ts` ← создайте этот файл!
