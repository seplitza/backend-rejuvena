import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

// Маппинг названий упражнений на длительность из JSON
const DURATIONS: Record<string, string> = {
  // PRO на шею
  'Разволокнение задней поверхности шеи': '2-5 минут',
  'Вращения головой с акцентом на растяжение': '5 в каждую сторону',
  
  // PRO на лоб и глаза
  'Лифтинг лба, бровей и верхних век': '2-3 минуты',
  'Массаж межбровья': '2-3 минуты',
  'Прокатывание складочки': '2-5 минут',
  'Стирание морщин на лбу PRO': '1 минута',
};

async function updateDurations() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    const tag = await Tag.findOne({ name: '+на_лоб_и_глаза' });
    
    if (!tag) {
      console.log('❌ Тег "+на_лоб_и_глаза" не найден');
      return;
    }

    const exercises = await Exercise.find({ tags: tag._id });
    console.log(`📦 Найдено упражнений: ${exercises.length}\n`);

    let updated = 0;

    for (const exercise of exercises) {
      const duration = DURATIONS[exercise.title];
      
      if (duration && (!exercise.duration || exercise.duration === '')) {
        exercise.duration = duration;
        await exercise.save();
        console.log(`✅ Обновлено: ${exercise.title} → ${duration}`);
        updated++;
      } else if (duration && exercise.duration) {
        console.log(`⏭️  Пропущено (уже есть длительность): ${exercise.title}`);
      } else {
        console.log(`⚠️  Нет данных о длительности: ${exercise.title}`);
      }
    }

    console.log(`\n📊 Обновлено: ${updated} упражнений`);

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
  }
}

updateDurations().catch(console.error);
