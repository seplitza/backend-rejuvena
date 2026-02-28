import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function makeEnTagVisible() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    const enTag = await Tag.findOne({ slug: 'en' });

    if (!enTag) {
      console.log('❌ Тег EN не найден');
      return;
    }

    console.log(`📌 Текущее состояние тега EN:`);
    console.log(`   Название: ${enTag.name}`);
    console.log(`   Цвет: ${enTag.color}`);
    console.log(`   Видимый: ${enTag.isVisible}\n`);

    if (enTag.isVisible) {
      console.log('✅ Тег уже видимый!');
    } else {
      enTag.isVisible = true;
      await enTag.save();
      console.log('✅ Тег EN теперь ВИДИМЫЙ в админке!\n');
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Отключено от MongoDB');
  }
}

makeEnTagVisible();
