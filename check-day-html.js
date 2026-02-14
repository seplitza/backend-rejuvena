const mongoose = require('mongoose');
const MarathonDay = require('./dist/models/MarathonDay.model.js').default;

mongoose.connect('mongodb://localhost:27017/rejuvena')
  .then(async () => {
    const day = await MarathonDay.findOne({ 
      marathonId: '698ed3f3a6ef329baa134976',
      dayNumber: 1 
    });
    
    if (day) {
      console.log('📝 Description HTML:');
      console.log(day.description.substring(0, 500));
      console.log('\n---\n');
      
      // Check if it contains H1, H2, H3 tags
      console.log('Has H1:', day.description.includes('<h1'));
      console.log('Has H2:', day.description.includes('<h2'));
      console.log('Has H3:', day.description.includes('<h3'));
      console.log('Has p tags:', day.description.includes('<p>'));
    } else {
      console.log('❌ Day not found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
