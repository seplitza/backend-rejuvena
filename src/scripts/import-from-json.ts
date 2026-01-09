import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

interface ExerciseData {
  title: string;
  description: string;
  content: string;
  duration: string;
  carouselMedia: any[];
  category: string;
  isPremium: boolean;
  isPublished: boolean;
  tagNames: string[];
}

async function importFromJson() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Читаем JSON файл
    const jsonPath = process.argv[2] || '/tmp/exercises-export.json';
    console.log(`📄 Читаем файл: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ Файл не найден:', jsonPath);
      return;
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const exercisesData: ExerciseData[] = JSON.parse(jsonData);
    
    console.log(`📦 Найдено упражнений в файле: ${exercisesData.length}\n`);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    for (const data of exercisesData) {
      // Проверяем, существует ли упражнение
      const existing = await Exercise.findOne({ title: data.title });
      
      if (existing) {
        console.log(`⏭️  Пропускаем (уже существует): ${data.title}`);
        skipped++;
        continue;
      }

      // Получаем или создаем теги
      const tagIds = [];
      for (const tagName of data.tagNames) {
        let tag = await Tag.findOne({ name: tagName });
        
        if (!tag) {
          // Создаем новый тег
          tag = new Tag({
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-'),
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
          });
          await tag.save();
          console.log(`   ✨ Создан новый тег: ${tagName}`);
        }
        
        tagIds.push(tag._id);
      }

      // Создаем упражнение
      const exercise = new Exercise({
        title: data.title,
        description: data.description,
        content: data.content,
        duration: data.duration,
        carouselMedia: data.carouselMedia,
        category: data.category,
        isPremium: data.isPremium,
        isPublished: data.isPublished,
        tags: tagIds
      });

      await exercise.save();
      console.log(`✅ Импортировано: ${data.title} (${data.duration})`);
      imported++;
    }

    console.log('\n📊 Статистика:');
    console.log(`   ✅ Импортировано: ${imported}`);
    console.log(`   ⏭️  Пропущено: ${skipped}`);
    console.log(`   🔄 Обновлено: ${updated}`);

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Отключено от MongoDB');
  }
}

importFromJson().catch(console.error);
