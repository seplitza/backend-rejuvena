const mongoose = require('mongoose');
require('dotenv').config();

const marathonSchema = new mongoose.Schema({}, { strict: false, collection: 'marathons' });
const Marathon = mongoose.model('Marathon', marathonSchema);

const marathonDaySchema = new mongoose.Schema({}, { strict: false, collection: 'marathondays' });
const MarathonDay = mongoose.model('MarathonDay', marathonDaySchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Ищу марафон "Омолодись"...\n');
    
    const marathons = await Marathon.find({ name: /омолодись/i }).select('_id name');
    console.log('Найденные марафоны:', marathons);
    
    if (marathons.length > 0) {
      const marathonId = marathons[0]._id;
      console.log(`\nПроверяю дни для марафона ID: ${marathonId}`);
      
      const days = await MarathonDay.find({ marathon: marathonId })
        .sort({ dayNumber: 1 })
        .select('dayNumber description');
      
      console.log(`\nНайдено дней: ${days.length}`);
      days.forEach(day => {
        const length = day.description ? day.description.length : 0;
        console.log(`День ${day.dayNumber}: ${length} символов`);
      });
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
