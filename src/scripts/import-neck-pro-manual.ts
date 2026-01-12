import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import { getRuTag } from './utils/ru-tag';

dotenv.config();

// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// Курс "+на шею" - PRO
const MARATHON_ID = 'b8775841-7b7d-43ca-b556-a9ce74d339cf';
const DAY_ID = '579e5c43-1b08-4d11-a281-b2cfac0850b1'; // День 7

async function importNeckPro() {
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
    
    // Ищем категорию "PRO на шею"
    const targetCategory = dayCategories.find((cat: any) => 
      cat.categoryName.toLowerCase().includes('pro') && 
      cat.categoryName.toLowerCase().includes('шею')
    );

    if (!targetCategory) {
      console.log('❌ Категория "PRO на шею" не найдена');
      console.log('Доступные категории:');
      dayCategories.forEach((cat: any) => console.log(`  - ${cat.categoryName}`));
      return;
    }

    console.log(`📂 Категория: ${targetCategory.categoryName} (${targetCategory.exercises.length} упражнений)\n`);

    // Создаем/получаем теги
    const ruTag = await getRuTag();
    const tagNames = ['Шея', '+на шею', 'PRO'];
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await Tag.findOne({ name });
        if (!tag) {
          tag = await Tag.create({ 
            name, 
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, ''),
            color: '#10B981' // Зеленый цвет для упражнений на шею
          });
          console.log(`✅ Создан тег: #${name}`);
        }
        return tag;
      })
    );
    tags.push(ruTag);

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
    
    console.log('\n📝 Импортированные упражнения:');
    console.log('1. Вращения головой с акцентом на растяжение');
    console.log('2. Разволокнение задней поверхности шеи');
    console.log('3. Массаж ГКСМ');
    console.log('4. Глубокая пальпация');
    console.log('5. Хорды');
    console.log('6. Лифтинг диафрагмы рта');
    console.log('7. Лифтинг второго подбородка');
    console.log('8. Перетирание морщин на шее');

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
importNeckPro().catch(console.error);
