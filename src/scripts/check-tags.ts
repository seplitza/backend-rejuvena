import mongoose from 'mongoose';
import Tag from '../models/Tag.model';
import dotenv from 'dotenv';

dotenv.config();

async function checkTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    console.log('\n📋 Все теги в базе данных:');
    const allTags = await Tag.find().sort({ name: 1 });
    allTags.forEach(tag => {
      const visibility = tag.isVisible === false ? '🔒 скрытый' : '👁️  видимый';
      console.log(`  - ${tag.name} (slug: ${tag.slug}) ${visibility}`);
    });
    
    console.log('\n✅ Только видимые теги (как в API):');
    const visibleTags = await Tag.find({ 
      $or: [
        { isVisible: { $ne: false } },
        { isVisible: { $exists: false } }
      ]
    }).sort({ name: 1 });
    visibleTags.forEach(tag => console.log(`  - ${tag.name}`));
    
    console.log('\n🔒 Скрытые теги:');
    const hiddenTags = await Tag.find({ isVisible: false }).sort({ name: 1 });
    hiddenTags.forEach(tag => console.log(`  - ${tag.name}`));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkTags();
