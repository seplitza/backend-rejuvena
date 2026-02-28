const mongoose = require('mongoose');
require('dotenv').config();

const marathonDaySchema = new mongoose.Schema({}, { strict: false, collection: 'marathondays' });
const MarathonDay = mongoose.model('MarathonDay', marathonDaySchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const days = await MarathonDay.find({ marathon: '697dde2ce5bf02ef8d04876d' })
      .sort({ dayNumber: 1 })
      .select('dayNumber description');
    
    console.log('Текущее состояние дней марафона Омолодись:');
    days.forEach(day => {
      const length = day.description ? day.description.length : 0;
      const preview = day.description ? day.description.substring(0, 80).replace(/\n/g, ' ') : 'пусто';
      console.log(`День ${day.dayNumber}: ${length} символов - ${preview}...`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
