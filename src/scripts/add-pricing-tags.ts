import mongoose from 'mongoose';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';

async function addPricingTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('Connected to MongoDB');

    // Создаём теги
    const tags = [
      { name: 'Бесплатное', slug: 'free', color: '#10B981' },
      { name: 'Платное базовое', slug: 'paid-basic', color: '#F59E0B' },
      { name: 'Платное продвинутое', slug: 'paid-advanced', color: '#EF4444' },
      { name: 'На осанку', slug: 'posture', color: '#8B5CF6' }
    ];

    for (const tagData of tags) {
      await Tag.findOneAndUpdate({ slug: tagData.slug }, tagData, { upsert: true, new: true });
      console.log(`✅ Tag "${tagData.name}" created/updated`);
    }

    const freeTag = await Tag.findOne({ slug: 'free' });
    const paidBasicTag = await Tag.findOne({ slug: 'paid-basic' });
    const postureTag = await Tag.findOne({ slug: 'posture' });

    // Упражнения на осанку - бесплатные (5 штук)
    const freePostureExercises = [
      'Лифтинг висков PRO',
      'Лифтинг скуловой области', 
      'Перетирания висков',  // вместо "Перетягивание F2"
      'Коррекция носослезной борозды',
      'Лифтинг щек. Разминания'  // вместо "Лифтинг щек. Перетягивание"
    ];

    // Упражнения на осанку - платные базовые (4 штуки)
    const paidPostureExercises = [
      'Верхнее веко PRO',  // вместо "Лифтинг век"
      'Массаж подбородка и челюсти',  // вместо "Профилактика второго подбородка"
      'Базовая растяжка шеи',  // вместо "Лифтинг шеи"
      'На валике'
    ];

    // Обновляем бесплатные
    for (const title of freePostureExercises) {
      const result = await Exercise.updateOne(
        { title },
        {
          $addToSet: { tags: { $each: [freeTag!._id, postureTag!._id] } },
          $set: { category: 'На осанку', price: 0, isPremium: false }
        }
      );
      console.log(`📝 Free posture: ${title} (${result.modifiedCount} modified)`);
    }

    // Обновляем платные
    for (const title of paidPostureExercises) {
      const result = await Exercise.updateOne(
        { title },
        {
          $addToSet: { tags: { $each: [paidBasicTag!._id, postureTag!._id] } },
          $set: { category: 'На осанку', price: 100, isPremium: true }
        }
      );
      console.log(`💰 Paid posture: ${title} (${result.modifiedCount} modified)`);
    }

    // Остальные - бесплатные
    await Exercise.updateMany(
      { category: { $ne: 'На осанку' } },
      {
        $addToSet: { tags: freeTag!._id },
        $set: { price: 0, isPremium: false, category: 'Общие' }
      }
    );
    console.log('✅ Updated other exercises as free');

    const stats = await Exercise.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          free: { $sum: { $cond: [{ $eq: ['$price', 0] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $gt: ['$price', 0] }, 1, 0] } }
        }
      }
    ]);

    console.log('\n📊 Statistics:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} total (${stat.free} free, ${stat.paid} paid)`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPricingTags();
