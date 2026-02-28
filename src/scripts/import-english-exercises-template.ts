import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import { getEnTag } from './utils/en-tag';

dotenv.config();

// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';

// ⚠️ НАСТРОЙТЕ ЭТИ ПАРАМЕТРЫ ⚠️
// 
// 💡 КАК НАЙТИ marathonId:
// 1. Откройте https://seplitza.github.io/Rejuvena_old_app/courses
// 2. F12 → Console → найдите "Order #X:" и скопируйте "id"
// 
// ГОТОВЫЕ marathonId АНГЛИЙСКИХ КУРСОВ:
// - Look Younger (Basic):                  8ae4db8b-b256-462a-8918-7e7811243d64
// - +Advanced for the Neck:                fc62d140-17af-4c61-be90-63a6cc656a7b
// - +Advanced for The Forehead and Eyes:   3c33c808-523c-4e60-b284-139e2a136544
// - +Advanced for Mid-face and Eyes:       e7ce939d-b84a-4816-b5bf-ed347646f943
// - 1 goal. Slow down aging:               3efe72d6-aea6-489d-9208-4eaa8979fbd3

const MARATHON_ID = 'YOUR_MARATHON_ID_HERE'; // <-- Вставьте marathonId из списка выше
const DAY_ID = 'YOUR_DAY_ID_HERE'; // <-- Заполните dayId (F12 → Network → getdayexercise)
const COURSE_NAME = 'Advanced Neck'; // <-- Название курса для тегов
const CATEGORY_SEARCH = 'advanced'; // <-- Поисковая строка для категории

async function importEnglishExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Получаем данные из API
    console.log('📡 Запрашиваем данные из API...');
    console.log(`   Marathon ID: ${MARATHON_ID}`);
    console.log(`   Day ID: ${DAY_ID}`);
    console.log(`   Language: EN\n`);
    
    const response = await axios.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
      params: {
        marathonId: MARATHON_ID,
        dayId: DAY_ID,
        timeZoneOffset: -180
      },
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'en' // ✅ АНГЛИЙСКИЙ ЯЗЫК!
      }
    });

    // Извлекаем упражнения из dayCategories
    const dayCategories = response.data.marathonDay?.dayCategories || [];
    console.log(`📦 Получено категорий: ${dayCategories.length}\n`);
    
    // Показываем все доступные категории
    console.log('📋 Доступные категории:');
    dayCategories.forEach((cat: any, index: number) => {
      console.log(`   ${index + 1}. ${cat.categoryName} (${cat.exercises?.length || 0} упражнений)`);
    });
    console.log('');

    // Ищем целевую категорию
    const targetCategory = dayCategories.find((cat: any) => 
      cat.categoryName.toLowerCase().includes(CATEGORY_SEARCH.toLowerCase())
    );

    if (!targetCategory) {
      console.log(`❌ Категория содержащая "${CATEGORY_SEARCH}" не найдена`);
      console.log('💡 Проверьте CATEGORY_SEARCH в начале файла и попробуйте другое название');
      return;
    }

    console.log(`✅ Выбрана категория: ${targetCategory.categoryName}`);
    console.log(`   Упражнений: ${targetCategory.exercises.length}\n`);

    // Создаем/получаем теги
    const enTag = await getEnTag(); // Тег EN (скрытый)
    
    // ⚠️ НАСТРОЙТЕ ТЕГИ ДЛЯ ВАШЕГО КУРСА ⚠️
    const tagNames = ['Advanced', 'Neck', 'PRO']; // Например: ['Basic', 'Face'], ['Advanced', 'Eyes']
    
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await Tag.findOne({ name });
        if (!tag) {
          tag = await Tag.create({ 
            name, 
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, ''),
            color: '#10B981' // Зеленый цвет для EN упражнений
          });
          console.log(`✅ Создан тег: #${name}`);
        }
        return tag;
      })
    );
    tags.push(enTag);

    console.log(`\n🏷️  Теги для импорта: ${tags.map(t => t.name).join(', ')}\n`);

    let imported = 0;
    let skipped = 0;

    // Импортируем упражнения из API
    for (const oldExercise of targetCategory.exercises) {
      const exerciseName = oldExercise.exerciseName;
      
      try {
        // Проверяем, существует ли упражнение с таким именем
        let exercise = await Exercise.findOne({ title: exerciseName });

        // Если упражнение уже существует, пропускаем его
        if (exercise) {
          console.log(`⏭️  Пропущено (уже существует): ${exerciseName}`);
          skipped++;
          continue;
        }

        // Конвертируем exerciseContents в carouselMedia
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

        // Создаем новое упражнение
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

    console.log('\n' + '='.repeat(60));
    console.log('📊 РЕЗУЛЬТАТЫ ИМПОРТА');
    console.log('='.repeat(60));
    console.log(`✅ Импортировано новых упражнений: ${imported}`);
    console.log(`⏭️  Пропущено (уже существует): ${skipped}`);
    console.log(`📦 Всего обработано: ${imported + skipped}`);
    console.log(`🏷️  Теги: ${tags.map(t => `#${t.name}`).join(' ')}`);
    console.log(`🌍 Язык: EN (английский)`);
    console.log(`📂 Категория: ${targetCategory.categoryName}`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('❌ ОШИБКА:', error.message);
    if (error.response) {
      console.error('📡 Ответ API:', error.response.status, error.response.statusText);
      console.error('💡 Проверьте OLD_API_TOKEN в .env файле');
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Отключено от MongoDB\n');
  }
}

// Запускаем импорт
importEnglishExercises();
