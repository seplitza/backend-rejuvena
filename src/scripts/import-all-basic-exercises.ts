/**
 * Import REMAINING BASIC exercises from "+Advanced for the Neck" Day 1 JSON
 * 
 * ALREADY IMPORTED (skip):
 * - "Advanced for the Neck" (8 exercises)
 * - "Lymphatic drainage" (3 exercises)
 * 
 * TO IMPORT:
 * - Posture (9 exercises)
 * - Basic massages (16 exercises)
 * - Sculpting massage (3 exercises)
 * - Vacuum massage (3 exercises)
 * - Better in the evening (1 exercise)
 * 
 * TOTAL TO IMPORT: 32 exercises
 * 
 * USAGE:
 * 1. Save full JSON response from OLD APP to: src/scripts/data/course-full-data.json
 * 2. Run: npx ts-node src/scripts/import-all-basic-exercises.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import Exercise from '../models/Exercise.model';
import { getEnTag } from './utils/en-tag';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

// Categories to SKIP (already imported)
const SKIP_CATEGORIES = [
  'Advanced for the Neck',
  'Lymphatic drainage'
];

// Image/video conversion helper
function convertMediaUrl(url: string): { type: 'image' | 'video', url: string } {
  if (url.includes('player.vimeo.com')) {
    return { type: 'video', url };
  }
  return { type: 'image', url };
}

async function importBasicExercises() {
  try {
    // Connect to MongoDB
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Get EN tag
    const enTag = await getEnTag();
    console.log(`\n📌 Тег EN найден/создан: ${enTag._id}`);

    // Read JSON file
    const jsonPath = path.join(__dirname, 'data', 'course-full-data.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`\n❌ ОШИБКА: Файл ${jsonPath} не найден!`);
      console.log('\nИнструкции:');
      console.log('1. Откройте браузер Chrome в режиме инкогнито');
      console.log('2. Войдите в OLD APP админку');
      console.log('3. Откройте DevTools (F12) → Network');
      console.log('4. Найдите курс "+Advanced for the Neck"');
      console.log('5. Откройте первый день (Day 1)');
      console.log('6. В Network найдите запрос GET /api/marathon/{marathonId}/day/{dayId}');
      console.log('7. Скопируйте полный JSON ответ');
      console.log(`8. Сохраните в: ${jsonPath}`);
      process.exit(1);
    }

    const courseData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`\n📄 JSON загружен из ${jsonPath}`);

    // Filter only categories we need to import
    const categoriesToImport = courseData.marathonDay.dayCategories.filter((cat: any) => 
      !SKIP_CATEGORIES.includes(cat.categoryName)
    );

    console.log(`\n📚 Категории для импорта (${categoriesToImport.length}):`);
    categoriesToImport.forEach((cat: any) => {
      console.log(`  - ${cat.categoryName} (${cat.exercises.length} упражнений)`);
    });

    let totalImported = 0;
    let totalSkipped = 0;

    // Import exercises from each category
    for (const category of categoriesToImport) {
      console.log(`\n\n🏷️  КАТЕГОРИЯ: ${category.categoryName}`);
      console.log(`══════════════════════════════════════`);

      for (const ex of category.exercises) {
        // Check if exercise already exists by name
        const existing = await Exercise.findOne({ title: ex.exerciseName });
        
        if (existing) {
          console.log(`  ⏩ ПРОПУСК: "${ex.exerciseName}" - уже существует`);
          totalSkipped++;
          continue;
        }

        // Convert exercise contents to media array
        const media: any[] = ex.exerciseContents
          .sort((a: any, b: any) => a.order - b.order)
          .map((content: any) => {
            const { type, url } = convertMediaUrl(content.contentPath);
            return { type, url, order: content.order };
          });

        // Create new exercise
        const newExercise = new Exercise({
          title: ex.exerciseName,
          description: ex.exerciseDescription,
          media,
          tags: [enTag._id],
          isActive: true,
          order: ex.order
        });

        await newExercise.save();
        console.log(`  ✅ ИМПОРТ: "${ex.exerciseName}" (${media.length} медиа)`);
        totalImported++;
      }
    }

    console.log(`\n\n╔════════════════════════════════════════╗`);
    console.log(`║         ИМПОРТ ЗАВЕРШЕН ✅             ║`);
    console.log(`╚════════════════════════════════════════╝`);
    console.log(`\n📊 Статистика:`);
    console.log(`  ✅ Импортировано: ${totalImported} упражнений`);
    console.log(`  ⏩ Пропущено: ${totalSkipped} (уже существуют)`);
    console.log(`  📝 Тег EN добавлен ко всем новым упражнениям`);

  } catch (error) {
    console.error('\n❌ ОШИБКА:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Отключено от MongoDB');
  }
}

// Run import
importBasicExercises()
  .then(() => {
    console.log('\n🎉 Скрипт завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Скрипт завершен с ошибкой:', error.message);
    process.exit(1);
  });
