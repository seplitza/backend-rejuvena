const { MongoClient, ObjectId } = require('mongodb');

const PRODUCTION_URI = 'mongodb://127.0.0.1:27018';

async function checkAllDays() {
  const client = new MongoClient(PRODUCTION_URI);

  try {
    await client.connect();
    console.log('✅ Connected to PRODUCTION MongoDB');

    const db = client.db('rejuvena');
    const marathonDaysCollection = db.collection('marathondays');

    // Найти ВСЕ дни
    const allDays = await marathonDaysCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    console.log(`\n📊 Last 20 marathon days in database:\n`);

    allDays.forEach(day => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Day ${day.dayNumber}:`);
      console.log(`  ID: ${day._id}`);
      console.log(`  Marathon ID: ${day.marathonId}`);
      console.log(`  Title: ${day.title || 'N/A'}`);
      console.log(`  Description length: ${day.description?.length || 0} chars`);
      console.log(`  Exercises: ${day.exercises?.length || 0}`);
      console.log('');
    });

    // Проверим марафон напрямую
    const marathonsCollection = db.collection('marathons');
    const marathon = await marathonsCollection.findOne({ 
      _id: new ObjectId('69733e6ff22ce2297694b8a9') 
    });

    if (marathon) {
      console.log('\n📌 Marathon found:');
      console.log(`  Title: ${marathon.title}`);
      console.log(`  Number of days: ${marathon.numberOfDays || 'N/A'}`);
      
      // Попробуем найти дни по ObjectId
      const daysByObjectId = await marathonDaysCollection
        .find({ marathonId: marathon._id })
        .toArray();
      console.log(`  Days found (by ObjectId): ${daysByObjectId.length}`);
      
      // Попробуем найти по строке
      const daysByString = await marathonDaysCollection
        .find({ marathonId: '69733e6ff22ce2297694b8a9' })
        .toArray();
      console.log(`  Days found (by string): ${daysByString.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkAllDays();
