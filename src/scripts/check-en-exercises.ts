import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function checkEnExercises() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Находим тег EN
    const enTag = await Tag.findOne({ slug: 'en' });
    const ruTag = await Tag.findOne({ slug: 'ru' });

    if (!enTag) {
      console.log('❌ Тег EN не найден!');
      return;
    }

    console.log(`✅ Тег EN найден: ${enTag.name} (${enTag.color}, visible: ${enTag.isVisible})\n`);

    // Все упражнения с тегом EN
    const enExercises = await Exercise.find({ tags: enTag._id });
    console.log(`📚 Всего EN упражнений: ${enExercises.length}\n`);

    if (enExercises.length > 0) {
      console.log('📝 Список EN упражнений:\n');
      for (const ex of enExercises) {
        const tags = await Tag.find({ _id: { $in: ex.tags } });
        const tagNames = tags.map(t => t.name).join(', ');
        console.log(`   ${ex.title}`);
        console.log(`   Категория: ${ex.category || 'Не указана'}`);
        console.log(`   Теги: ${tagNames}`);
        console.log('');
      }
    }

    // Статистика
    const total = await Exercise.countDocuments();
    const ruCount = await Exercise.countDocuments({ tags: ruTag?._id });
    
    console.log('📊 СТАТИСТИКА:');
    console.log(`   Всего упражнений: ${total}`);
    console.log(`   RU упражнений: ${ruCount}`);
    console.log(`   EN упражнений: ${enExercises.length}`);
    console.log(`   Без языка: ${total - ruCount - enExercises.length}`);

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Отключено от MongoDB');
  }
}

checkEnExercises();
