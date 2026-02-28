const mongoose = require('mongoose');
require('dotenv').config();

const marathonSchema = new mongoose.Schema({}, { strict: false, collection: 'marathons' });
const Marathon = mongoose.model('Marathon', marathonSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Все марафоны в базе данных:\n');
    
    const marathons = await Marathon.find({}).select('_id name');
    marathons.forEach(m => {
      console.log(`ID: ${m._id}`);
      console.log(`Name: ${m.name}`);
      console.log('---');
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
