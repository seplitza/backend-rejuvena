import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

async function addRuTagToAllExercises() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Найти или создать тег RU
    let ruTag = await Tag.findOne({ name: 'RU' });
    
    if (!ruTag) {
      ruTag = await Tag.create({
        name: 'RU',
        slug: 'ru',
        description: 'Упражнения на русском языке',
        isVisible: false // Скрыть тег от отображения во фронтенде
      });
      console.log('✅ Создан тег RU');
    } else {
      // Убедимся, что тег скрыт
      ruTag.isVisible = false;
      await ruTag.save();
      console.log('✅ Тег RU найден и настроен как скрытый');
    }

    // Найти все упражнения, у которых нет тега RU
    const exercises = await Exercise.find({
      tags: { $ne: ruTag._id }
    });

    console.log(`📊 Найдено ${exercises.length} упражнений без тега RU`);

    let updated = 0;
    for (const exercise of exercises) {
      exercise.tags.push(ruTag._id);
      await exercise.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`⏳ Обработано ${updated}/${exercises.length} упражнений`);
      }
    }

    console.log(`✅ Добавлен тег RU к ${updated} упражнениям`);

    // Показать статистику
    const totalWithRuTag = await Exercise.countDocuments({
      tags: ruTag._id
    });
    console.log(`📊 Всего упражнений с тегом RU: ${totalWithRuTag}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
}

addRuTagToAllExercises();
