const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function check() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const Exercise = mongoose.model('Exercise', new mongoose.Schema({}, { strict: false }));
    const Tag = mongoose.model('Tag', new mongoose.Schema({}, { strict: false }));
    
    const total = await Exercise.countDocuments();
    const active = await Exercise.countDocuments({ isActive: true });
    const inactive = await Exercise.countDocuments({ isActive: false });
    
    const enTag = await Tag.findOne({ name: 'EN' });
    console.log('\nТег EN:');
    console.log('  ID:', enTag._id.toString());
    console.log('  Visible:', enTag.isVisible);
    console.log('  Color:', enTag.color);
    
    const enExercises = await Exercise.countDocuments({ tags: enTag._id });
    const enActive = await Exercise.countDocuments({ tags: enTag._id, isActive: true });
    const enInactive = await Exercise.countDocuments({ tags: enTag._id, isActive: false });
    
    console.log('\nВсего упражнений:', total);
    console.log('  Активных:', active);
    console.log('  Неактивных:', inactive);
    
    console.log('\nEN упражнения:');
    console.log('  Всего с тегом EN:', enExercises);
    console.log('  Активных EN:', enActive);
    console.log('  Неактивных EN:', enInactive);
    
    // Show some EN exercise names
    const someEN = await Exercise.find({ tags: enTag._id }).limit(5).select('title isActive');
    console.log('\nПримеры EN упражнений:');
    someEN.forEach(ex => {
      console.log(`  - ${ex.title} (active: ${ex.isActive})`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
