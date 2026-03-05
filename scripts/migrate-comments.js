// MongoDB Migration Script for Comments Update
// Запускать через: node scripts/migrate-comments.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

// Определяем схему Comment напрямую, чтобы избежать проблем с импортом
const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  marathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marathon' },
  marathonDayNumber: Number,
  content: { type: String, required: true },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  isPrivate: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'spam'], default: 'pending' },
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  adminResponseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: Date,
  likes: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  starred: { type: Boolean, default: false }
}, { timestamps: true });

const Comment = mongoose.model('Comment', CommentSchema);

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
    console.log(`✅ Обновлено комментариев (starred): ${result.modifiedCount}`);

    // 2. Проставляем respondedBy для существующих ответов админа
    console.log('\n👤 Проставляем respondedBy для ответов админа...');
    
    // Найти все ответы (комментарии с parentCommentId), которые одобрены и без respondedBy
    const adminReplies = await Comment.find({
      parentCommentId: { $exists: true },
      status: 'approved',
      respondedBy: { $exists: false }
    });
    
    console.log(`Найдено ответов админа без respondedBy: ${adminReplies.length}`);
    
    let updatedReplies = 0;
    for (const reply of adminReplies) {
      // Устанавливаем respondedBy равным userId (автор ответа)
      reply.respondedBy = reply.userId;
      await reply.save();
      updatedReplies++;
    }
    
    console.log(`✅ Обновлено ответов админа: ${updatedReplies}`);

    // 3. Создаем индекс для starred
    console.log('\n🔍 Создаем индекс для starred...');
    await Comment.collection.createIndex({ starred: 1 });
    console.log('✅ Индекс создан');

    // 4. Проверяем статистику
    console.log('\n📊 Статистика комментариев:');
    const stats = {
      total: await Comment.countDocuments(),
      rootComments: await Comment.countDocuments({ parentCommentId: { $exists: false } }),
      replies: await Comment.countDocuments({ parentCommentId: { $exists: true } }),
      pending: await Comment.countDocuments({ status: 'pending', parentCommentId: { $exists: false } }),
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
    console.log(`  Корневых комментариев (вопросы): ${stats.rootComments}`);
    console.log(`  Ответов: ${stats.replies}`);
    console.log(`  На модерации (только корневые): ${stats.pending}`);
    console.log(`  Одобренных: ${stats.approved}`);
    console.log(`  С ответом админа: ${stats.withAdminResponse}`);
    console.log(`  Ответов админа (с respondedBy): ${stats.adminReplies}`);
    console.log(`  Важных (starred): ${stats.starred}`);
    console.log(`  Привязано к упражнениям: ${stats.withExercise}`);

    // 5. Проверяем индексы
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
