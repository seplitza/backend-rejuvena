import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Marathon from '../models/Marathon.model';
import MarathonDay from '../models/MarathonDay.model';

dotenv.config();

async function fixAllMarathonDays() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB\n');

    const marathons = await Marathon.find({}).select('_id title').lean();
    console.log(`📋 Found ${marathons.length} marathons\n`);

    let totalFixed = 0;
    let totalChecked = 0;

    for (const marathon of marathons) {
      console.log(`\n🏃‍♀️ Checking marathon: ${marathon.title}`);
      console.log(`   ID: ${marathon._id}`);

      const days = await MarathonDay.find({ marathonId: marathon._id })
        .sort({ dayNumber: 1 })
        .lean();

      if (days.length === 0) {
        console.log('   ⚠️  No days found');
        continue;
      }

      console.log(`   Days: ${days.length}`);

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        totalChecked++;

        // День 1 всегда должен иметь пустой массив новых упражнений
        if (day.dayNumber === 1) {
          if (day.newExerciseIds && day.newExerciseIds.length > 0) {
            console.log(`   🔧 Day ${day.dayNumber}: fixing (should have no new exercises)`);
            await MarathonDay.findByIdAndUpdate(day._id, { newExerciseIds: [] });
            totalFixed++;
          }
          continue;
        }

        // Для дней > 1 сравниваем с предыдущим днем
        const previousDay = days[i - 1];
        if (!previousDay) continue;

        // Пропускаем дни без exerciseGroups
        if (!previousDay.exerciseGroups || !day.exerciseGroups) {
          continue;
        }

        const previousExerciseIds = new Set(
          previousDay.exerciseGroups.flatMap((g: any) =>
            g.exerciseIds.map((id: any) => id.toString())
          )
        );

        const currentExerciseIds = day.exerciseGroups.flatMap((g: any) =>
          g.exerciseIds.map((id: any) => id.toString())
        );

        const correctNewExercises = currentExerciseIds.filter(id => !previousExerciseIds.has(id));
        const currentNewExercises = (day.newExerciseIds || []).map((id: any) => id.toString());

        // Проверяем, нужно ли обновление
        const needsUpdate = 
          correctNewExercises.length !== currentNewExercises.length ||
          !correctNewExercises.every(id => currentNewExercises.includes(id));

        if (needsUpdate) {
          console.log(`   🔧 Day ${day.dayNumber}: fixing newExerciseIds`);
          console.log(`      Was: ${currentNewExercises.length} exercises`);
          console.log(`      Should be: ${correctNewExercises.length} exercises`);
          
          await MarathonDay.findByIdAndUpdate(day._id, { 
            newExerciseIds: correctNewExercises 
          });
          
          totalFixed++;
        }
      }

      console.log(`   ✅ Marathon checked`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total marathons: ${marathons.length}`);
    console.log(`   Total days checked: ${totalChecked}`);
    console.log(`   Total days fixed: ${totalFixed}`);
    console.log(`\n✅ All marathons processed!`);

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAllMarathonDays();
