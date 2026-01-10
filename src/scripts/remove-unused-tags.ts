/**
 * Скрипт для удаления неиспользуемых тегов
 * Удаляет теги: Йога, Пилатес, Растяжка, Эксперт
 */

import mongoose from 'mongoose';
import Tag from '../models/Tag.model';
import Exercise from '../models/Exercise.model';
import dotenv from 'dotenv';

dotenv.config();

async function removeUnusedTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

    const tagsToRemove = ['Йога', 'Пилатес', 'Растяжка', 'Эксперт'];
    
    // Найти эти теги
    const tags = await Tag.find({ name: { $in: tagsToRemove } });
    console.log(`📌 Найдено тегов для удаления: ${tags.length}`);

    if (tags.length === 0) {
      console.log('ℹ️  Теги не найдены, возможно уже удалены');
      process.exit(0);
      return;
    }

    const tagIds = tags.map(t => t._id);

    // Проверить используются ли эти теги
    const exercisesWithTags = await Exercise.find({ tags: { $in: tagIds } });
    
    if (exercisesWithTags.length > 0) {
      console.log(`⚠️  Внимание! Найдено упражнений с этими тегами: ${exercisesWithTags.length}`);
      console.log('Удаляем теги из упражнений...');
      
      // Удалить теги из упражнений
      for (const exercise of exercisesWithTags) {
        exercise.tags = exercise.tags.filter((tagId: any) => 
          !tagIds.some(removeId => removeId.equals(tagId))
        );
        await exercise.save();
        console.log(`  ✅ Очищено: ${exercise.title}`);
      }
    }

    // Удалить теги из базы
    const result = await Tag.deleteMany({ _id: { $in: tagIds } });
    console.log(`🗑️  Удалено тегов: ${result.deletedCount}`);
    
    tags.forEach(tag => {
      console.log(`  - ${tag.name}`);
    });

    console.log('✅ Все готово!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

removeUnusedTags();
