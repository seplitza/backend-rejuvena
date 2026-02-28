const { MongoClient, ObjectId } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017';
const MARATHON_ID = '69733e6ff22ce2297694b8a9'; // "+ на лоб и глаза"

async function findMarathonLocal() {
  const client = new MongoClient(LOCAL_URI);

  try {
    await client.connect();
    console.log('✅ Connected to LOCAL MongoDB (localhost:27017)');

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

    // Check marathondays for this specific marathon
    const marathonDaysCollection = db.collection('marathondays');
    const days = await marathonDaysCollection
      .find({ marathonId: MARATHON_ID })
      .sort({ dayNumber: 1 })
      .toArray();

    console.log(`\n📊 Marathon days for this marathon: ${days.length}`);
    if (days.length > 0) {
      days.forEach(day => {
        console.log(`  Day ${day.dayNumber}: ${day._id} - ${day.title || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

findMarathonLocal();
