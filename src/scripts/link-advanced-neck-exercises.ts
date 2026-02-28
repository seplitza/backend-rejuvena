import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

// Маппинг EN ↔ RU упражнений по названиям
const EXERCISE_PAIRS = [
  {
    en: 'Head rotations with emphasis on stretching',
    ru: 'Вращения головой с акцентом на растяжение'
  },
  {
    en: 'Fibers separation of the back of the neck',
    ru: 'Разволокнение задней поверхности шеи'
  },
  {
    en: 'SCM massage',
    ru: 'Массаж ГКСМ'
  },
  {
    en: 'Deep sliding palpation',
    ru: 'Глубокая пальпация'
  },
  {
    en: 'Cords relaxation',
    ru: 'Хорды'
  },
  {
    en: 'Oral diaphragm lifting',
    ru: 'Лифтинг диафрагмы рта'
  },
  {
    en: 'Double chin lifting',
    ru: 'Лифтинг второго подбородка'
  },
  {
    en: 'Erasing the neck lines',
    ru: 'Перетирание морщин на шее'
  }
];

async function linkAdvancedNeckExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    // Получаем теги
    const advancedTag = await Tag.findOne({ slug: 'advanced' });
    const proTag = await Tag.findOne({ slug: 'pro' });
    const neckTag = await Tag.findOne({ slug: 'neck' });

    if (!advancedTag || !proTag || !neckTag) {
      console.error('❌ Не найдены необходимые теги (Advanced, PRO, Neck)');
      return;
    }

    console.log('✅ Теги готовы: Продвинутый, PRO, Neck\n');

    const links = [];
    let linkedCount = 0;
    let tagsAddedCount = 0;

    // Обрабатываем каждую пару
    for (const pair of EXERCISE_PAIRS) {
      const enEx = await Exercise.findOne({ title: pair.en });
      const ruEx = await Exercise.findOne({ title: pair.ru });

      if (!enEx) {
        console.log(`⚠️  Не найдено EN: "${pair.en}"`);
        continue;
      }

      if (!ruEx) {
        console.log(`⚠️  Не найдено RU: "${pair.ru}"`);
        continue;
      }

      // Добавляем теги к русскому упражнению
      let tagsAdded = false;
      const ruTags = ruEx.tags.map((t: any) => t.toString());

      if (!ruTags.includes(advancedTag._id.toString())) {
        ruEx.tags.push(advancedTag._id);
        tagsAdded = true;
      }
      if (!ruTags.includes(proTag._id.toString())) {
        ruEx.tags.push(proTag._id);
        tagsAdded = true;
      }
      if (!ruTags.includes(neckTag._id.toString())) {
        ruEx.tags.push(neckTag._id);
        tagsAdded = true;
      }

      if (tagsAdded) {
        await ruEx.save();
        tagsAddedCount++;
      }

      // Создаем связь
      links.push({
        enId: enEx._id.toString(),
        ruId: ruEx._id.toString(),
        enTitle: enEx.title,
        ruTitle: ruEx.title,
        category: 'Advanced for the Neck / PRO на шею'
      });

      console.log(`✅ Связка создана:`);
      console.log(`   🇬🇧 ${enEx.title}`);
      console.log(`   🇷🇺 ${ruEx.title}`);
      if (tagsAdded) {
        console.log(`   🏷️  Теги добавлены к RU упражнению`);
      }
      console.log('');

      linkedCount++;
    }

    console.log('='.repeat(70));
    console.log('📊 ИТОГИ:');
    console.log('='.repeat(70));
    console.log(`✅ Создано связей: ${linkedCount}`);
    console.log(`🏷️  Добавлены теги: ${tagsAddedCount}`);
    console.log(`📦 Всего пар: ${EXERCISE_PAIRS.length}`);
    console.log('='.repeat(70));

    // Сохраняем связи
    if (links.length > 0) {
      const fs = require('fs');
      const linksPath = './advanced-neck-links.json';
      fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));
      console.log(`\n💾 Связи сохранены в: ${linksPath}\n`);
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Отключено от MongoDB');
  }
}

linkAdvancedNeckExercises();
