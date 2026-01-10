/**
 * Скрипт для замены тегов "продвинутое" и "Продвинутый" на "PRO"
 * 1. Находит все упражнения с тегами "продвинутое" или "Продвинутый"
 * 2. Добавляет к ним тег "PRO" если его нет
 * 3. Удаляет старые теги из упражнений
 * 4. Удаляет неиспользуемые теги из базы
 */

import mongoose from 'mongoose';
import Tag from '../models/Tag.model';
import Exercise from '../models/Exercise.model';
import dotenv from 'dotenv';

dotenv.config();

async function replaceAdvancedTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

    // Найти все нужные теги
    const oldTags = await Tag.find({ 
      name: { $in: ['продвинутое', 'Продвинутый'] } 
    });
    
    let proTag = await Tag.findOne({ name: 'PRO' });
    
    if (!proTag) {
      console.log('❌ Тег "PRO" не найден, создаем...');
      proTag = await Tag.create({
        name: 'PRO',
        slug: 'pro',
        color: '#9333EA' // Purple color
      });
      console.log('✅ Тег "PRO" создан');
    }

    console.log(`📌 Найдено старых тегов: ${oldTags.length}`);
    const oldTagIds = oldTags.map(t => t._id);

    // Найти все упражнения со старыми тегами
    const exercises = await Exercise.find({ tags: { $in: oldTagIds } });
    console.log(`📊 Найдено упражнений для обновления: ${exercises.length}`);

    // Обновить каждое упражнение
    for (const exercise of exercises) {
      const hasOldTag = exercise.tags.some((tagId: any) => 
        oldTagIds.some(oldId => oldId.equals(tagId))
      );
      
      const hasProTag = exercise.tags.some((tagId: any) => 
        tagId.equals(proTag!._id)
      );

      if (hasOldTag) {
        // Удалить старые теги
        exercise.tags = exercise.tags.filter((tagId: any) => 
          !oldTagIds.some(oldId => oldId.equals(tagId))
        );

        // Добавить PRO если нет
        if (!hasProTag) {
          exercise.tags.push(proTag!._id);
        }

        await exercise.save();
        console.log(`  ✅ Обновлено: ${exercise.title}`);
      }
    }

    // Удалить старые теги из базы
    await Tag.deleteMany({ _id: { $in: oldTagIds } });
    console.log(`🗑️  Удалено старых тегов: ${oldTagIds.length}`);

    console.log('✅ Все готово!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

replaceAdvancedTags();
