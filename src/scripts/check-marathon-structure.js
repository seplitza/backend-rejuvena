const mongoose = require('mongoose');
require('dotenv').config();

const marathonSchema = new mongoose.Schema({}, { strict: false, collection: 'marathons' });
const Marathon = mongoose.model('Marathon', marathonSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Структура марафона 697dde2ce5bf02ef8d04876d:\n');
    
    const marathon = await Marathon.findById('697dde2ce5bf02ef8d04876d');
    console.log(JSON.stringify(marathon, null, 2));
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
