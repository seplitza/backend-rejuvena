import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function checkImportedExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Находим тег "+на_лоб_и_глаза"
    const tag = await Tag.findOne({ name: '+на_лоб_и_глаза' });
    
    if (!tag) {
      console.log('❌ Тег "+на_лоб_и_глаза" не найден');
      return;
    }

    console.log(`✅ Найден тег: ${tag.name} (ID: ${tag._id})\n`);

    // Находим все упражнения с этим тегом
    const exercises = await Exercise.find({ tags: tag._id })
      .populate('tags', 'name')
      .sort({ category: 1, order: 1 });

    console.log(`📦 Найдено упражнений с тегом "+на_лоб_и_глаза": ${exercises.length}\n`);

    // Группируем по категориям
    const byCategory: Record<string, any[]> = {};
    
    exercises.forEach(ex => {
      const cat = ex.category || 'Без категории';
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push(ex);
    });

    // Выводим информацию
    Object.entries(byCategory).forEach(([category, exs]) => {
      console.log(`📂 ${category} (${exs.length} упражнений):`);
      exs.forEach((ex, idx) => {
        const tags = (ex.tags as any[]).map((t: any) => `#${t.name}`).join(', ');
        const mediaCount = ex.carouselMedia?.length || 0;
        console.log(`   ${idx + 1}. ${ex.title}`);
        console.log(`      Теги: ${tags}`);
        console.log(`      Медиа: ${mediaCount} файлов`);
        console.log(`      Длительность: ${ex.duration || 'не указана'}`);
      });
      console.log('');
    });

    // Общая статистика по тегам
    console.log('\n📊 Статистика по тегам:');
    const allTags = await Tag.find();
    for (const tag of allTags) {
      const count = await Exercise.countDocuments({ tags: tag._id });
      if (count > 0) {
        console.log(`   #${tag.name}: ${count} упражнений`);
      }
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
  }
}

checkImportedExercises().catch(console.error);
