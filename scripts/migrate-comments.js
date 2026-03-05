// MongoDB Migration Script for Comments Update
// Запускать через: node migrate-comments.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Comment from './src/models/Comment.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function migrate() {
  try {
    console.log('🔗 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // 1. Добавляем поле starred ко всем существующим комментариям
    console.log('\n📝 Обновляем существующие комментарии...');
    const result = await Comment.updateMany(
      { starred: { $exists: false } },
      { $set: { starred: false } }
    );
    console.log(`✅ Обновлено комментариев: ${result.modifiedCount}`);

    // 2. Создаем индекс для starred
    console.log('\n🔍 Создаем индекс для starred...');
    await Comment.collection.createIndex({ starred: 1 });
    console.log('✅ Индекс создан');

    // 3. Проверяем статистику
    console.log('\n📊 Статистика комментариев:');
    const stats = {
      total: await Comment.countDocuments(),
      pending: await Comment.countDocuments({ status: 'pending' }),
      approved: await Comment.countDocuments({ status: 'approved' }),
      withAdminResponse: await Comment.countDocuments({ adminResponseId: { $exists: true } }),
      adminReplies: await Comment.countDocuments({ 
        parentCommentId: { $exists: true },
        respondedBy: { $exists: true }
      }),
      starred: await Comment.countDocuments({ starred: true }),
      withExercise: await Comment.countDocuments({ exerciseId: { $exists: true } })
    };

    console.log(`  Всего комментариев: ${stats.total}`);
    console.log(`  На модерации: ${stats.pending}`);
    console.log(`  Одобренных: ${stats.approved}`);
    console.log(`  С ответом админа: ${stats.withAdminResponse}`);
    console.log(`  Ответов админа: ${stats.adminReplies}`);
    console.log(`  Важных (starred): ${stats.starred}`);
    console.log(`  Привязано к упражнениям: ${stats.withExercise}`);

    // 4. Проверяем индексы
    console.log('\n🔍 Проверяем индексы:');
    const indexes = await Comment.collection.indexes();
    console.log('Доступные индексы:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Миграция завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Отключено от MongoDB');
  }
}

migrate();
