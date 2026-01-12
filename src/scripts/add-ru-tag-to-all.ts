/**
 * Скрипт для добавления тега "RU" всем существующим упражнениям
 * Тег RU используется для фильтрации упражнений на русском языке
 * Он не отображается во фронтенде, но помогает при смене языка
 * 
 * Использование:
 * ts-node src/scripts/add-ru-tag-to-all.ts
 */

import mongoose from 'mongoose';
import Tag from '../models/Tag.model';
import Exercise from '../models/Exercise.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function addRuTagToAll() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Найти или создать тег "RU"
    let ruTag = await Tag.findOne({ name: 'RU' });
    
    if (!ruTag) {
      console.log('✨ Создаем тег "RU"...');
      ruTag = await Tag.create({
        name: 'RU',
        slug: 'ru',
        color: '#6B7280' // серый цвет для системного тега
      });
      console.log(`✅ Тег "RU" создан (ID: ${ruTag._id})\n`);
    } else {
      console.log(`✅ Тег "RU" уже существует (ID: ${ruTag._id})\n`);
    }

    // Найти все упражнения
    const allExercises = await Exercise.find({});
    console.log(`📊 Всего упражнений в базе: ${allExercises.length}\n`);

    // Добавить тег "RU" ко всем упражнениям, у которых его еще нет
    let addedCount = 0;
    let skippedCount = 0;

    for (const exercise of allExercises) {
      const hasRuTag = exercise.tags.some((tagId: any) => 
        tagId.equals(ruTag!._id)
      );

      if (!hasRuTag) {
        exercise.tags.push(ruTag!._id);
        await exercise.save();
        addedCount++;
        console.log(`  ✅ Добавлен тег RU: ${exercise.title}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Итоги:`);
    console.log(`   ✅ Тег RU добавлен к: ${addedCount} упражнениям`);
    console.log(`   ⏭️  Уже было: ${skippedCount} упражнений`);
    console.log(`   📦 Всего обработано: ${allExercises.length} упражнений`);

    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
    console.log('✅ Готово!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addRuTagToAll();
