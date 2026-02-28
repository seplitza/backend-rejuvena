import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Exercise from '../models/Exercise.model';
import { getEnTag } from './utils/en-tag';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function publishEnExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Получаем EN тег
    const enTag = await getEnTag();
    console.log(`📌 Тег EN найден: ${enTag._id}\n`);

    // Находим все упражнения с тегом EN которые не опубликованы
    const unpublishedEN = await Exercise.find({
      tags: enTag._id,
      isPublished: false
    });

    console.log(`📋 Найдено неопубликованных EN упражнений: ${unpublishedEN.length}\n`);

    if (unpublishedEN.length === 0) {
      console.log('✅ Все EN упражнения уже опубликованы!');
      return;
    }

    // Публикуем все EN упражнения
    const result = await Exercise.updateMany(
      { tags: enTag._id, isPublished: false },
      { $set: { isPublished: true } }
    );

    console.log(`✅ Опубликовано ${result.modifiedCount} упражнений\n`);

    // Проверяем результат
    const totalEN = await Exercise.countDocuments({ tags: enTag._id });
    const publishedEN = await Exercise.countDocuments({ tags: enTag._id, isPublished: true });

    console.log('📊 Статистика EN упражнений:');
    console.log(`   Всего: ${totalEN}`);
    console.log(`   Опубликовано: ${publishedEN}`);
    console.log(`   Не опубликовано: ${totalEN - publishedEN}`);

  } catch (error) {
    console.error('\n❌ ОШИБКА:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Отключено от MongoDB');
  }
}

publishEnExercises()
  .then(() => {
    console.log('\n🎉 Скрипт завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Скрипт завершен с ошибкой:', error.message);
    process.exit(1);
  });
