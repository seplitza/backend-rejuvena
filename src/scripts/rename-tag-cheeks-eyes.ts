/**
 * Скрипт для переименования тега "нащекииглаза" → "+на щеки и глаза"
 * Также обновляет все упражнения с этим тегом
 */

import mongoose from 'mongoose';
import Tag from '../models/Tag.model';
import Exercise from '../models/Exercise.model';
import dotenv from 'dotenv';

dotenv.config();

async function renameTag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

    // Найти старый тег
    const oldTag = await Tag.findOne({ name: 'нащекииглаза' });
    
    if (!oldTag) {
      console.log('❌ Тег "нащекииглаза" не найден');
      return;
    }

    console.log(`📌 Найден тег: ${oldTag.name} (ID: ${oldTag._id})`);

    // Переименовать тег
    oldTag.name = '+на щеки и глаза';
    await oldTag.save();
    console.log(`✅ Тег переименован на "${oldTag.name}"`);

    // Найти все упражнения с этим тегом
    const exercises = await Exercise.find({ tags: oldTag._id });
    console.log(`📊 Найдено упражнений с этим тегом: ${exercises.length}`);

    // Готово! Упражнения автоматически получат новое имя тега через populate
    
    console.log('✅ Готово!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

renameTag();
