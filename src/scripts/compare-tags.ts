import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function compareTags() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Английские Advanced для шеи
    console.log('🇬🇧 АНГЛИЙСКИЕ "Advanced for the Neck":');
    const enNeckExercises = await Exercise.find({ category: 'Advanced for the Neck' });
    
    for (const ex of enNeckExercises) {
      const tags = await Tag.find({ _id: { $in: ex.tags } });
      const tagNames = tags.map(t => t.name).join(', ');
      console.log(`   📝 ${ex.title}`);
      console.log(`      Теги: ${tagNames}\n`);
    }

    // Русские PRO на шею
    console.log('\n🇷🇺 РУССКИЕ "PRO на шею":');
    const ruNeckExercises = await Exercise.find({ category: 'PRO на шею' });
    
    for (const ex of ruNeckExercises) {
      const tags = await Tag.find({ _id: { $in: ex.tags } });
      const tagNames = tags.map(t => t.name).join(', ');
      console.log(`   📝 ${ex.title}`);
      console.log(`      Теги: ${tagNames}\n`);
    }

    // Все теги в базе
    console.log('\n🏷️  Все теги в базе:');
    const allTags = await Tag.find().sort({ name: 1 });
    allTags.forEach(tag => {
      console.log(`   ${tag.name} (${tag.slug}) - ${tag.color} ${tag.isVisible ? '👁️' : '🔒'}`);
    });

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Отключено от MongoDB');
  }
}

compareTags();
