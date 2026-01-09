import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function exportExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Находим тег "+на_лоб_и_глаза"
    const foreheadTag = await Tag.findOne({ name: '+на_лоб_и_глаза' });
    
    if (!foreheadTag) {
      console.log('❌ Тег "+на_лоб_и_глаза" не найден');
      return;
    }

    // Получаем упражнения
    const exercises = await Exercise.find({ tags: foreheadTag._id })
      .populate('tags')
      .lean();

    console.log(`📦 Найдено упражнений: ${exercises.length}\n`);

    // Преобразуем для экспорта (заменяем ObjectId на названия тегов)
    const exportData = exercises.map(ex => ({
      title: ex.title,
      description: ex.description,
      content: ex.content,
      duration: ex.duration || '',
      carouselMedia: ex.carouselMedia,
      category: ex.category,
      isPremium: ex.isPremium,
      isPublished: ex.isPublished,
      tagNames: (ex.tags as any[]).map((t: any) => t.name)
    }));

    // Сохраняем в JSON
    const json = JSON.stringify(exportData, null, 2);
    fs.writeFileSync('/tmp/exercises-export.json', json);
    
    console.log('✅ Экспортировано в /tmp/exercises-export.json');
    console.log('\nУпражнения:');
    exportData.forEach((ex, idx) => {
      console.log(`${idx + 1}. ${ex.title} (${ex.duration})`);
    });

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
  }
}

exportExercises().catch(console.error);
