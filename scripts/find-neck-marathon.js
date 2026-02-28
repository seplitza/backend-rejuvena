const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = 'mongodb://127.0.0.1:27018';
const DB_NAME = 'rejuvena';

async function findNeckMarathon() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME
    });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const marathonsCollection = db.collection('marathons');
    const daysCollection = db.collection('marathondays');

    // Ищем марафон со словами "шею" или "шея" в названии
    const marathons = await marathonsCollection.find({
      $or: [
        { title: /шею/i },
        { title: /шея/i },
        { title: /neck/i }
      ]
    }).toArray();

    console.log(`\n📊 Найдено марафонов: ${marathons.length}\n`);

    for (const marathon of marathons) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Marathon ID: ${marathon._id}`);
      console.log(`Title: ${marathon.title}`);
      console.log(`Days count: ${marathon.days || 0}`);
      
      // Ищем дни этого марафона
      const days = await daysCollection.find({
        marathonId: new mongoose.Types.ObjectId(marathon._id)
      }).sort({ createdAt: 1 }).toArray();

      console.log(`\nДни марафона (найдено ${days.length}):`);
      
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        console.log(`\n  День ${i + 1}:`);
        console.log(`    ID: ${day._id}`);
        console.log(`    Description length: ${day.description ? day.description.length : 0} chars`);
        console.log(`    Exercises: ${day.exercises ? day.exercises.length : 0}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Connection closed');
  }
}

findNeckMarathon();
