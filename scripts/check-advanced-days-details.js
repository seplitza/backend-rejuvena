const { MongoClient, ObjectId } = require('mongodb');

const PRODUCTION_URI = 'mongodb://127.0.0.1:27018';
const MARATHON_ID = '69733e6ff22ce2297694b8a9'; // "+ на лоб и глаза"

async function checkDaysDetails() {
  const client = new MongoClient(PRODUCTION_URI);

  try {
    await client.connect();
    console.log('✅ Connected to PRODUCTION MongoDB via SSH tunnel (localhost:27018)');

    const db = client.db('rejuvena');
    const marathonDaysCollection = db.collection('marathondays');

    // Find all days for this marathon
    const days = await marathonDaysCollection
      .find({ marathonId: MARATHON_ID })
      .sort({ dayNumber: 1 })
      .toArray();

    console.log(`\n📊 Found ${days.length} days for marathon:\n`);

    days.forEach(day => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Day ${day.dayNumber}:`);
      console.log(`  ID: ${day._id}`);
      console.log(`  Title: ${day.title || 'N/A'}`);
      console.log(`  Description: ${day.description ? `${day.description.substring(0, 200)}...` : 'EMPTY'}`);
      console.log(`  Description length: ${day.description?.length || 0} chars`);
      console.log(`  Exercises count: ${day.exercises?.length || 0}`);
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✅ Connection closed');
  }
}

checkDaysDetails();
