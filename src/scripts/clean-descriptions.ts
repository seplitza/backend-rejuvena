import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';

dotenv.config();

const cleanDescription = (text: string): string => {
  let cleaned = text;
  
  // Удаляем эмодзи и специальные символы Unicode
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Эмодзи
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Разные символы
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
  
  // Удаляем множественные пробелы и переносы строк
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Убираем пробелы в начале и конце
  cleaned = cleaned.trim();
  
  return cleaned;
};

async function cleanExerciseDescriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Подключено к MongoDB');

    const exercises = await Exercise.find({});
    console.log(`📝 Найдено упражнений: ${exercises.length}`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const exercise of exercises) {
      const originalDescription = exercise.description;
      const cleanedDescription = cleanDescription(originalDescription);

      if (originalDescription !== cleanedDescription) {
        exercise.description = cleanedDescription;
        await exercise.save();
        updatedCount++;
        console.log(`✏️  Обновлено: "${exercise.title}"`);
        console.log(`   Было: "${originalDescription.substring(0, 100)}..."`);
        console.log(`   Стало: "${cleanedDescription.substring(0, 100)}..."`);
      } else {
        unchangedCount++;
      }
    }

    console.log('\n📊 Результаты:');
    console.log(`✅ Обновлено: ${updatedCount}`);
    console.log(`⏭️  Без изменений: ${unchangedCount}`);

    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

cleanExerciseDescriptions();
