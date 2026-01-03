import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

async function updateExerciseTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Подключено к MongoDB');

    // Находим или создаем тег "Базовое"
    let baseTag = await Tag.findOne({ name: 'Базовое' });
    
    if (!baseTag) {
      baseTag = new Tag({
        name: 'Базовое',
        slug: 'bazovoe',
        color: '#3B82F6'
      });
      await baseTag.save();
      console.log('✨ Создан тег "Базовое"');
    } else {
      console.log('✅ Тег "Базовое" уже существует');
    }

    // Находим все упражнения
    const exercises = await Exercise.find({});
    console.log(`📝 Найдено упражнений: ${exercises.length}\n`);

    let updatedCount = 0;

    for (const exercise of exercises) {
      // Очищаем все теги
      exercise.tags = [baseTag._id];
      await exercise.save();
      
      updatedCount++;
      console.log(`✅ Обновлено: ${exercise.title}`);
    }

    console.log('\n📊 Итого:');
    console.log(`✅ Обновлено упражнений: ${updatedCount}`);
    console.log(`🏷️  Всем присвоен тег: "Базовое"`);

    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

updateExerciseTags();
