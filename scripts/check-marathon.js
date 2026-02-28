const { MongoClient, ObjectId } = require('mongodb');

const PRODUCTION_URI = 'mongodb://127.0.0.1:27018';
const MARATHON_ID = '69733e6ff22ce2297694b8a9'; // "+ на лоб и глаза"

async function findMarathon() {
  const client = new MongoClient(PRODUCTION_URI);

  try {
    await client.connect();
    console.log('✅ Connected to PRODUCTION MongoDB via SSH tunnel (localhost:27018)');

    const db = client.db('seplitza');
    
    // Check marathons collection
    const marathonsCollection = db.collection('marathons');
    const marathon = await marathonsCollection.findOne({ _id: new ObjectId(MARATHON_ID) });

    if (marathon) {
      console.log('\n✅ Found marathon:');
      console.log(`  ID: ${marathon._id}`);
      console.log(`  Title: ${marathon.title}`);
      console.log(`  Description: ${marathon.description?.substring(0, 100)}...`);
      console.log(`  Number of days: ${marathon.numberOfDays || 'N/A'}`);
    } else {
      console.log('\n❌ Marathon not found!');
      
      // List all marathons to see what's available
      const allMarathons = await marathonsCollection.find({}).toArray();
      console.log(`\n📋 Available marathons (${allMarathons.length} total):`);
      allMarathons.forEach(m => {
        console.log(`  ${m._id} - ${m.title}`);
      });
    }

    // Also check marathondays collection
    const marathonDaysCollection = db.collection('marathondays');
    const allDays = await marathonDaysCollection.find({}).limit(5).toArray();
    console.log(`\n📋 Sample marathon days (showing first 5):`);
    allDays.forEach(day => {
      console.log(`  Day ${day.dayNumber}: marathonId=${day.marathonId}, _id=${day._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

findMarathon();
