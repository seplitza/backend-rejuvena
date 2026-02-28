import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarathonDay from '../models/MarathonDay.model';

dotenv.config();

const MARATHON_ID = '697dde2ce5bf02ef8d04876d';

async function checkNewExercises() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB\n');

    // Проверяем дни 7 и 8
    const day7 = await MarathonDay.findOne({ 
      marathonId: MARATHON_ID, 
      dayNumber: 7 
    }).lean();
    
    const day8 = await MarathonDay.findOne({ 
      marathonId: MARATHON_ID, 
      dayNumber: 8 
    }).lean();

    if (!day7) {
      console.log('❌ День 7 не найден!');
    } else {
      console.log('📅 День 7:');
      console.log('   Day Number:', day7.dayNumber);
      console.log('   Day Type:', day7.dayType);
      console.log('   Exercise Groups:', day7.exerciseGroups.length);
      
      const day7ExerciseIds = day7.exerciseGroups.flatMap((g: any) => 
        g.exerciseIds.map((id: any) => id.toString())
      );
      console.log('   Total exercises:', day7ExerciseIds.length);
      console.log('   Exercise IDs:', day7ExerciseIds);
      
      day7.exerciseGroups.forEach((group: any, idx: number) => {
        console.log(`   Group ${idx + 1}:`, group.categoryId, '- exercises:', group.exerciseIds.length);
      });
      console.log('');
    }

    if (!day8) {
      console.log('❌ День 8 не найден!');
    } else {
      console.log('📅 День 8:');
      console.log('   Day Number:', day8.dayNumber);
      console.log('   Day Type:', day8.dayType);
      console.log('   Exercise Groups:', day8.exerciseGroups.length);
      
      const day8ExerciseIds = day8.exerciseGroups.flatMap((g: any) => 
        g.exerciseIds.map((id: any) => id.toString())
      );
      console.log('   Total exercises:', day8ExerciseIds.length);
      console.log('   Exercise IDs:', day8ExerciseIds);
      
      day8.exerciseGroups.forEach((group: any, idx: number) => {
        console.log(`   Group ${idx + 1}:`, group.categoryId, '- exercises:', group.exerciseIds.length);
      });
      
      console.log('');
      console.log('🆕 New Exercise IDs in day 8:');
      console.log('   Count:', day8.newExerciseIds?.length || 0);
      console.log('   IDs:', day8.newExerciseIds?.map((id: any) => id.toString()) || []);
      console.log('');
    }

    // Сравниваем
    if (day7 && day8) {
      const day7ExerciseIds = new Set(
        day7.exerciseGroups.flatMap((g: any) => 
          g.exerciseIds.map((id: any) => id.toString())
        )
      );
      
      const day8ExerciseIds = day8.exerciseGroups.flatMap((g: any) => 
        g.exerciseIds.map((id: any) => id.toString())
      );

      const actualNewExercises = day8ExerciseIds.filter(id => !day7ExerciseIds.has(id));
      
      console.log('📊 Анализ:');
      console.log('   Упражнений в дне 7:', day7ExerciseIds.size);
      console.log('   Упражнений в дне 8:', day8ExerciseIds.length);
      console.log('   ДОЛЖНО быть новых:', actualNewExercises.length);
      console.log('   В БД записано новых:', day8.newExerciseIds?.length || 0);
      console.log('');
      
      if (actualNewExercises.length !== (day8.newExerciseIds?.length || 0)) {
        console.log('⚠️  НЕСООТВЕТСТВИЕ! Исправляем...');
        
        await MarathonDay.findOneAndUpdate(
          { marathonId: MARATHON_ID, dayNumber: 8 },
          { newExerciseIds: actualNewExercises }
        );
        
        console.log('✅ День 8 исправлен!');
        console.log('   Новые упражнения:', actualNewExercises);
      } else {
        console.log('✅ Всё правильно!');
      }
    }

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNewExercises();
