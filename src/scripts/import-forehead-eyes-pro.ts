import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// Курс "+на лоб и глаза" - PRO
const MARATHON_ID = '11e5f1f2-de4e-4833-a7e5-3089c40be78f';
const DAY_ID = '50ac7597-c8fc-4ade-8588-7ca9526d403d'; // День 2

async function importForeheadEyesPro() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Получаем данные из API
    console.log('📡 Запрашиваем данные из API...');
    
    const response = await axios.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
      params: {
        marathonId: MARATHON_ID,
        dayId: DAY_ID,
        timeZoneOffset: -180
      },
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'ru'
      }
    });

    // Извлекаем упражнения из dayCategories
    const dayCategories = response.data.marathonDay?.dayCategories || [];
    console.log(`📦 Получено категорий: ${dayCategories.length}`);
    
    // Ищем категории "PRO на шею" и "PRO на лоб и глаза"
    const targetCategories = dayCategories.filter((cat: any) => 
      cat.categoryName.includes('PRO на шею') || 
      cat.categoryName.includes('PRO на лоб и глаза')
    );

    if (targetCategories.length === 0) {
      console.log('❌ Целевые категории не найдены');
      console.log('Доступные категории:');
      dayCategories.forEach((cat: any) => console.log(`  - ${cat.categoryName}`));
      return;
    }

    console.log(`📂 Найдено категорий: ${targetCategories.length}\n`);

    // Создаем/получаем теги
    const tagNames = ['продвинутое', 'PRO', '+на_лоб_и_глаза'];
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await Tag.findOne({ name });
        if (!tag) {
          tag = await Tag.create({ 
            name, 
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, ''),
            color: '#3B82F6' 
          });
          console.log(`✅ Создан тег: #${name}`);
        }
        return tag;
      })
    );

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let duplicates = 0;

    // Импортируем упражнения из каждой категории
    for (const category of targetCategories) {
      console.log(`\n📂 Обрабатываем категорию: ${category.categoryName} (${category.exercises.length} упражнений)`);

      for (const oldExercise of category.exercises) {
        const exerciseName = oldExercise.exerciseName;
        
        try {
          // Проверяем, существует ли упражнение с таким именем
          let exercise = await Exercise.findOne({ title: exerciseName });

          if (exercise && exercise.tags && exercise.tags.length > 0) {
            // Упражнение уже существует и имеет теги - пропускаем (возможно из другого курса)
            console.log(`⏭️  Пропущено (дубликат): ${exerciseName}`);
            duplicates++;
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

          if (exercise) {
            // Обновляем существующее упражнение (без тегов или с пустыми тегами)
            exercise.content = oldExercise.exerciseDescription || exercise.content;
            exercise.carouselMedia = carouselMedia;
            exercise.tags = tags.map(tag => tag._id);
            exercise.category = category.categoryName;
            await exercise.save();
            
            console.log(`🔄 Обновлено: ${exerciseName} (${carouselMedia.length} медиа)`);
            updated++;
          } else {
            // Создаем новое упражнение
            exercise = await Exercise.create({
              title: exerciseName,
              description: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
              content: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
              carouselMedia: carouselMedia,
              tags: tags.map(tag => tag._id),
              duration: oldExercise.marathonExerciseName || '',
              order: oldExercise.order || 0,
              category: category.categoryName
            });
            
            console.log(`✅ Импортировано: ${exerciseName} (${carouselMedia.length} медиа)`);
            imported++;
          }
        } catch (error: any) {
          console.error(`❌ Ошибка при обработке "${exerciseName}":`, error.message);
          skipped++;
        }
      }
    }

    console.log('\n📊 Результаты импорта:');
    console.log(`✅ Импортировано новых: ${imported}`);
    console.log(`🔄 Обновлено существующих: ${updated}`);
    console.log(`⏭️  Пропущено дубликатов: ${duplicates}`);
    console.log(`❌ Ошибок: ${skipped}`);
    console.log(`📦 Всего обработано: ${imported + updated + skipped + duplicates}`);

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Ответ сервера:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
  }
}

// Запуск
importForeheadEyesPro().catch(console.error);
