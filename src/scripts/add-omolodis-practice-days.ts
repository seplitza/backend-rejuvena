/**
 * Add practice days (15-30) to Омолодись marathon
 * These are the "greatExtensionDays" that allow users to continue practicing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarathonDay from '../models/MarathonDay.model';

dotenv.config();

const MARATHON_ID = '697dde2ce5bf02ef8d04876d'; // Омолодись

// Description for practice days (повторение всех упражнений)
const PRACTICE_DAY_DESCRIPTION = `<h2>🌟 День {DAY_NUMBER}. Практика омоложения</h2>

<p>Здравствуйте!</p>

<p><strong>Сегодня день практики</strong> — закрепляем все освоенные техники.</p>

### 📋 Ваш план на сегодня:

Выполняйте **полный комплекс упражнений** из дней 1-14:

1. ✅ **Шея** — упражнения из Дня 2
2. ✅ **Лоб** — техники из Дней 3-4  
3. ✅ **Средняя часть лица** — массаж из Дня 5
4. ✅ **Линия подбородка** — техники из Дня 8
5. ✅ **Верхняя часть лица** — из Дня 9
6. ✅ **Глаза и губы** — массаж из Дня 10
7. ✅ **Жевательные мышцы** — из Дня 11
8. ✅ **Вакуумный массаж** — техника из Дня 13
9. ✅ **Скульптурный массаж** — из Дня 14

### ⏰ Время для практики:

**20-30 минут** ежедневно — это ваша инвестиция в молодость и красоту.

### 📝 Важное правило «5+2»:

- **5 дней подряд** — полная практика
- **2 дня** — отдых (только гидромассаж)

### 💎 Ваши результаты:

После **14 дней обучения** вы освоили базовый курс «Омолодись».  
Теперь **регулярная практика** закрепит результат и приумножит эффект.

<p><strong>Помните</strong>: Красота и молодость — это ежедневная практика, а не разовое действие.</p>

<p>Откройте приложение и начните свою практику!</p>

<p>С уважением,<br>Команда Rejuvena 💜</p>`;

async function addPracticeDays() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Adding practice days 16-30 to Омолодись marathon\n');

    const daysToCreate = [];
    
    // Create days 16-30 (practice days)
    for (let dayNum = 16; dayNum <= 30; dayNum++) {
      const description = PRACTICE_DAY_DESCRIPTION.replace('{DAY_NUMBER}', dayNum.toString());
      
      daysToCreate.push({
        marathonId: MARATHON_ID,
        dayNumber: dayNum,
        dayType: 'practice', // Important: mark as practice day
        title: `День ${dayNum}. Практика`,
        description: description,
        order: dayNum,
        exercises: [], // Practice days reference all exercises from days 1-14
        exerciseGroups: [], // Will be populated by referencing basic course exercises
        isPublished: true,
        publishDate: new Date(), // Available immediately
      });
    }

    console.log(`ℹ️  Creating ${daysToCreate.length} practice days...`);
    
    // Check if days already exist
    const existingDays = await MarathonDay.find({
      marathonId: MARATHON_ID,
      dayNumber: { $gte: 16, $lte: 30 }
    });

    if (existingDays.length > 0) {
      console.log(`\n⚠️  Found ${existingDays.length} existing practice days. Deleting them first...`);
      await MarathonDay.deleteMany({
        marathonId: MARATHON_ID,
        dayNumber: { $gte: 16, $lte: 30 }
      });
      console.log('✅ Existing practice days deleted');
    }

    // Insert new practice days
    const created = await MarathonDay.insertMany(daysToCreate);
    
    console.log(`\n✅ Successfully created ${created.length} practice days (16-30)`);
    console.log('\n📅 Practice days summary:');
    created.forEach((day: any) => {
      console.log(`  Day ${day.dayNumber}: ${day.title} (${day.dayType})`);
    });

    // Get total count
    const totalDays = await MarathonDay.countDocuments({ marathonId: MARATHON_ID });
    console.log(`\n📊 Total marathon days now: ${totalDays}`);
    
    console.log('\n✅ Practice days added successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test in web app: click on Омолодись -> should open Day 18');
    console.log('   2. Verify practice days have proper exercises reference');
    console.log('   3. Consider adding specific practice day exercises later\n');

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addPracticeDays();
