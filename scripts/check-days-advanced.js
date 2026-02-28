const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb://127.0.0.1:27018';
const MARATHON_ID = '69733e6ff22ce2297694b8a9';

async function checkDaysDetails() {
  const client = new MongoClient(PRODUCTION_URI);

  try {
    await client.connect();
    console.log('✅ Connected to PRODUCTION MongoDB');

    const db = client.db('rejuvena');
    const marathonDaysCollection = db.collection('marathondays');

    const days = await marathonDaysCollection
      .find({ marathonId: MARATHON_ID })
      .sort({ dayNumber: 1 })
      .toArray();

    console.log(`\n📊 Found ${days.length} days:\n`);

    days.forEach(day => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Day ${day.dayNumber}:`);
      console.log(`  ID: ${day._id}`);
      console.log(`  Title: ${day.title || 'N/A'}`);
      console.log(`  Description length: ${day.description?.length || 0} chars`);
      if (day.description) {
        console.log(`  First 150 chars: ${day.description.substring(0, 150)}...`);
      } else {
        console.log(`  Description: EMPTY ⚠️`);
      }
      console.log(`  Exercises: ${day.exercises?.length || 0}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✅ Connection closed');
  }
}

checkDaysDetails();
