import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function checkExercises() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    const total = await Exercise.countDocuments();
    console.log(`📊 Всего упражнений в базе: ${total}\n`);

    // Группируем по категориям
    const byCategory = await Exercise.aggregate([
      { $group: { _id: '$category', count: { $count: {} } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📂 По категориям:');
    byCategory.forEach((cat: any) => {
      console.log(`   ${cat._id || 'Без категории'}: ${cat.count}`);
    });

    // Новые английские упражнения
    console.log('\n🆕 Последние импортированные упражнения:');
    const recent = await Exercise.find()
      .sort({ _id: -1 })
      .limit(10);

    for (const ex of recent) {
      const tags = await Tag.find({ _id: { $in: ex.tags } });
      const tagNames = tags.map((t: any) => t.name).join(', ');
      console.log(`   📝 ${ex.title}`);
      console.log(`      Категория: ${ex.category || 'Не указана'}`);
      console.log(`      Теги: ${tagNames}`);
      console.log(`      Медиа: ${ex.carouselMedia?.length || 0}`);
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Отключено от MongoDB');
  }
}

checkExercises();
