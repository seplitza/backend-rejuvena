import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function checkExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Проверяем теги
    const tags = await Tag.find({});
    console.log(`📊 Всего тегов в БД: ${tags.length}`);
    tags.forEach(tag => {
      console.log(`   - ${tag.name} (ID: ${tag._id})`);
    });

    // Проверяем упражнения
    const allExercises = await Exercise.find({}).populate('tags');
    console.log(`\n📊 Всего упражнений в БД: ${allExercises.length}\n`);

    // Ищем упражнения с тегом "+на_лоб_и_глаза"
    const foreheadTag = await Tag.findOne({ name: '+на_лоб_и_глаза' });
    
    if (foreheadTag) {
      const foreheadExercises = await Exercise.find({ tags: foreheadTag._id }).populate('tags');
      console.log(`🔍 Упражнений с тегом "+на_лоб_и_глаза": ${foreheadExercises.length}`);
      
      foreheadExercises.forEach((ex, idx) => {
        console.log(`\n${idx + 1}. ${ex.title}`);
        console.log(`   ID: ${ex._id}`);
        console.log(`   Category: ${ex.category}`);
        console.log(`   Duration: ${ex.duration || 'не указано'}`);
        console.log(`   Premium: ${ex.isPremium ? 'Да' : 'Нет'}`);
        console.log(`   Published: ${ex.isPublished ? 'Да' : 'Нет'}`);
        console.log(`   Media: ${ex.carouselMedia?.length || 0} файлов`);
        console.log(`   Tags: ${(ex.tags as any[]).map((t: any) => t.name).join(', ')}`);
      });
    } else {
      console.log('❌ Тег "+на_лоб_и_глаза" не найден');
    }

    // Проверяем последние 10 добавленных упражнений
    const recentExercises = await Exercise.find({}).sort({ createdAt: -1 }).limit(10).populate('tags');
    console.log(`\n\n📅 Последние 10 добавленных упражнений:`);
    recentExercises.forEach((ex, idx) => {
      console.log(`\n${idx + 1}. ${ex.title}`);
      console.log(`   Создано: ${ex.createdAt}`);
      console.log(`   Category: ${ex.category}`);
      console.log(`   Tags: ${(ex.tags as any[]).map((t: any) => t.name).join(', ')}`);
    });

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
  }
}

checkExercises().catch(console.error);
