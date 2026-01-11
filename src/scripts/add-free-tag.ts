import mongoose from 'mongoose';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

interface ITag {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  color: string;
}

interface IExercise {
  _id: mongoose.Types.ObjectId;
  title: string;
  tags: ITag[];
  createdAt: Date;
}

async function addFreeTag() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB\n');

    // Create or get "На здоровье" tag
    let freeTag = await Tag.findOne({ name: 'На здоровье' });
    if (!freeTag) {
      freeTag = await Tag.create({
        name: 'На здоровье',
        slug: 'na-zdorovie',
        color: '#10b981', // green color for free
      });
      console.log('✅ Создан тег "На здоровье"');
    } else {
      console.log('ℹ️  Тег "На здоровье" уже существует');
    }

    // Get first 6 exercises (oldest by creation date)
    const allExercises = await Exercise.find().populate('tags').sort({ createdAt: 1 }) as unknown as IExercise[];
    console.log(`\nВсего упражнений в базе: ${allExercises.length}`);

    // Определяем бесплатные упражнения - первые 6 базовых
    const baseExercises = allExercises.filter((ex: IExercise) => 
      ex.tags.some((t: ITag) => t.name === 'Базовое')
    );
    const freeExercises = baseExercises.slice(0, 6);

    console.log(`\nБудут помечены как бесплатные (первые 6 базовых):`);
    freeExercises.forEach((ex: IExercise, i: number) => {
      console.log(`  ${i + 1}. ${ex.title}`);
    });

    // Add "На здоровье" tag to first 6 exercises
    let updated = 0;
    for (const exercise of freeExercises) {
      const hasFreeTag = exercise.tags.some((t: ITag) => t.name === 'На здоровье');
      if (!hasFreeTag) {
        await Exercise.findByIdAndUpdate(
          exercise._id,
          { $addToSet: { tags: freeTag._id } }
        );
        updated++;
      }
    }

    console.log(`\n✅ Обновлено ${updated} упражнений`);

    // Show final stats
    const updatedExercises = await Exercise.find().populate('tags') as unknown as IExercise[];
    const withFreeTag = updatedExercises.filter((ex: IExercise) => 
      ex.tags.some((t: ITag) => t.name === 'На здоровье')
    );
    const withBasicTag = updatedExercises.filter((ex: IExercise) => 
      ex.tags.some((t: ITag) => t.name === 'Базовое')
    );
    const withProTag = updatedExercises.filter((ex: IExercise) => 
      ex.tags.some((t: ITag) => t.name === 'продвинутое' || t.name === 'PRO')
    );

    console.log('\n📊 Итоговая статистика:');
    console.log(`  • БЕСПЛАТНЫЕ (с тегом "На здоровье"): ${withFreeTag.length}`);
    console.log(`  • БАЗОВЫЕ (100₽): ${withBasicTag.length - withFreeTag.length}`);
    console.log(`  • ПРОДВИНУТЫЕ/PRO (200₽): ${withProTag.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Готово!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

addFreeTag();
