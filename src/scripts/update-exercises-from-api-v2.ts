import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';

dotenv.config();

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
const MARATHON_ID = '7dd68a73-14f4-4763-be77-5b4ad63ab545';
const DAY_ID = 'c5707d15-a471-4426-9b0d-a64b4c93050c';

async function updateExercises() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Подключено к MongoDB');

    // Получаем данные упражнений из старого API
    console.log('📡 Запрашиваем данные из старого API...');
    
    const response = await axios.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
      params: {
        marathonId: MARATHON_ID,
        dayId: DAY_ID,
        timeZoneOffset: -180
      },
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'en'
      }
    });

    // Извлекаем упражнения из dayCategories
    const dayCategories = response.data.marathonDay?.dayCategories || [];
    console.log(`📦 Получено категорий: ${dayCategories.length}`);
    
    // Собираем все упражнения из всех категорий
    const allExercises: any[] = [];
    dayCategories.forEach((category: any) => {
      if (category.exercises && Array.isArray(category.exercises)) {
        console.log(`  - ${category.categoryName}: ${category.exercises.length} упражнений`);
        allExercises.push(...category.exercises);
      }
    });
    
    console.log(`📦 Всего упражнений: ${allExercises.length}\n`);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundNames: string[] = [];

    for (const oldExercise of allExercises) {
      const exerciseName = oldExercise.exerciseName;
      
      // Находим упражнение в нашей базе по имени
      const exercise = await Exercise.findOne({ title: exerciseName });
      
      if (!exercise) {
        console.log(`⏭️ Не найдено в БД: ${exerciseName}`);
        notFoundCount++;
        notFoundNames.push(exerciseName);
        continue;
      }

      // Конвертируем exerciseContents в carouselMedia
      const carouselMedia = (oldExercise.exerciseContents || [])
        .filter((content: any) => content.isActive) // Берем только активные
        .sort((a: any, b: any) => a.order - b.order) // Сортируем по order
        .map((content: any) => {
          // Извлекаем имя файла из URL
          const url = content.contentPath || '';
          const filename = url.split('/').pop() || `${content.type}-${content.order}`;
          
          return {
            type: content.type === 'video' ? 'video' : 'image',
            url: url,
            filename: filename,
            order: content.order
          };
        });

      // Обновляем упражнение
      exercise.content = oldExercise.exerciseDescription || exercise.content;
      exercise.carouselMedia = carouselMedia;
      
      await exercise.save();
      
      console.log(`✅ Обновлено: ${exerciseName} (${carouselMedia.length} медиа)`);
      updatedCount++;
    }

    console.log('\n📊 Итого:');
    console.log(`✅ Обновлено: ${updatedCount}`);
    console.log(`⏭️ Не найдено: ${notFoundCount}`);
    
    if (notFoundNames.length > 0) {
      console.log('\n❌ Не найденные упражнения:');
      notFoundNames.forEach(name => console.log(`  - ${name}`));
    }

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

updateExercises();
