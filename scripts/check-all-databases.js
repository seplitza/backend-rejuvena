const { MongoClient, ObjectId } = require('mongodb');

const PRODUCTION_URI = 'mongodb://127.0.0.1:27018';
const MARATHON_ID = '69733e6ff22ce2297694b8a9';

async function checkAllDatabases() {
  const client = new MongoClient(PRODUCTION_URI);

  try {
    await client.connect();
    console.log('✅ Connected to PRODUCTION MongoDB via SSH tunnel (localhost:27018)');

    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    console.log('\n📋 Available databases:');
    databases.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Check each database for marathons collection
    for (const dbInfo of databases.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') continue;
      
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      if (collections.some(c => c.name === 'marathons' || c.name === 'marathondays')) {
        console.log(`\n🔍 Checking database: ${dbInfo.name}`);
        
        const marathonsCollection = db.collection('marathons');
        const marathons = await marathonsCollection.find({}).toArray();
        console.log(`  Marathon count: ${marathons.length}`);
        
        if (marathons.length > 0) {
          marathons.forEach(m => {
            console.log(`    - ${m._id}: ${m.title || 'No title'}`);
          });
        }

        // Check for our specific marathon
        const ourMarathon = await marathonsCollection.findOne({ _id: new ObjectId(MARATHON_ID) });
        if (ourMarathon) {
          console.log(`\n  ✅ Found our marathon in database "${dbInfo.name}"!`);
          console.log(`     Title: ${ourMarathon.title}`);
          
          const marathonDaysCollection = db.collection('marathondays');
          const days = await marathonDaysCollection.find({ marathonId: MARATHON_ID }).sort({ dayNumber: 1 }).toArray();
          console.log(`     Days: ${days.length}`);
          
          if (days.length > 0) {
            days.forEach(day => {
              console.log(`       Day ${day.dayNumber}: ${day._id}`);
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkAllDatabases();
