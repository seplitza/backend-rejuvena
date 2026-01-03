import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// Курс "+на щеки и глаза" - PRO
const MARATHON_ID = 'b87370d5-4ce1-49b2-86f4-23deb9a99123';
const DAY_ID = 'fbab5db9-cab6-4768-9db4-ff37a4985748'; // День 6

async function importCheeksEyesPro() {
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
    
    // Ищем категорию "PRO на щеки и глаза"
    const targetCategory = dayCategories.find((cat: any) => 
      cat.categoryName.includes('щеки') && cat.categoryName.includes('глаза')
    );

    if (!targetCategory) {
      console.log('❌ Категория "PRO на щеки и глаза" не найдена');
      console.log('Доступные категории:');
      dayCategories.forEach((cat: any) => console.log(`  - ${cat.categoryName}`));
      return;
    }

    console.log(`📂 Категория: ${targetCategory.categoryName} (${targetCategory.exercises.length} упражнений)\n`);

    // Создаем/получаем теги
    const tagNames = ['нащекииглаза', 'продвинутое', 'PRO'];
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await Tag.findOne({ name });
        if (!tag) {
          tag = await Tag.create({ 
            name, 
            slug: name.toLowerCase().replace(/\s+/g, '-'),
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

    // Импортируем упражнения из API
    for (const oldExercise of targetCategory.exercises) {
      const exerciseName = oldExercise.exerciseName;
      
      try {
        // Проверяем, существует ли упражнение с таким именем
        let exercise = await Exercise.findOne({ title: exerciseName });

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
          // Обновляем существующее упражнение
          exercise.content = oldExercise.exerciseDescription || exercise.content;
          exercise.carouselMedia = carouselMedia;
          exercise.tags = tags.map(tag => tag._id);
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
            category: targetCategory.categoryName
          });
          
          console.log(`✅ Импортировано: ${exerciseName} (${carouselMedia.length} медиа)`);
          imported++;
        }
      } catch (error: any) {
        console.error(`❌ Ошибка при обработке "${exerciseName}":`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Результаты импорта:');
    console.log(`✅ Импортировано новых: ${imported}`);
    console.log(`🔄 Обновлено существующих: ${updated}`);
    console.log(`❌ Ошибок: ${skipped}`);
    console.log(`📦 Всего обработано: ${imported + updated + skipped}`);

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
importCheeksEyesPro().catch(console.error);
