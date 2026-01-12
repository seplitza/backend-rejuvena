import mongoose from 'mongoose';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Получаем теги
    const lipsJawTag = await Tag.findOne({ name: '+на губы и челюсть' });
    const proTag = await Tag.findOne({ name: 'PRO' });
    const ruTag = await Tag.findOne({ name: 'RU' });
    
    console.log('Теги:');
    console.log('  +на губы и челюсть:', lipsJawTag?._id.toString(), 'isVisible:', lipsJawTag?.isVisible);
    console.log('  PRO:', proTag?._id.toString(), 'isVisible:', proTag?.isVisible);
    console.log('  RU:', ruTag?._id.toString(), 'isVisible:', ruTag?.isVisible);
    
    // Проверяем упражнения
    const exercise = await Exercise.findOne({ title: 'Расслабление носогубных складок' }).populate('tags');
    console.log('\nПример упражнения: Расслабление носогубных складок');
    console.log('Теги упражнения:', exercise?.tags.map((t: any) => t.name).join(', '));
    
    // Считаем упражнения с тегом "+на губы и челюсть"
    const count = await Exercise.countDocuments({ tags: lipsJawTag?._id });
    console.log(`\nВсего упражнений с тегом "+на губы и челюсть": ${count}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Ошибка:', error);
    await mongoose.connection.close();
  }
}

check();
