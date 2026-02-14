import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function fixMarathonProgressIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collection = db.collection('marathonexerciseprogresses');

    // List current indexes
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if old index exists
    const oldIndexName = 'userId_1_marathonId_1_exerciseId_1';
    const hasOldIndex = indexes.some(idx => idx.name === oldIndexName);

    if (hasOldIndex) {
      console.log(`\nDropping old index: ${oldIndexName}`);
      await collection.dropIndex(oldIndexName);
      console.log('✓ Old index dropped');
    } else {
      console.log(`\n✓ Old index "${oldIndexName}" does not exist (already removed or never created)`);
    }

    // Check if new index exists
    const newIndexName = 'userId_1_marathonId_1_dayNumber_1_exerciseId_1';
    const hasNewIndex = indexes.some(idx => idx.name === newIndexName);

    if (!hasNewIndex) {
      console.log('\nCreating new index with dayNumber...');
      await collection.createIndex(
        { userId: 1, marathonId: 1, dayNumber: 1, exerciseId: 1 },
        { unique: true, name: newIndexName }
      );
      console.log('✓ New index created');
    } else {
      console.log('\n✓ New index already exists');
    }

    // List final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✓ Index migration completed successfully!');
  } catch (error) {
    console.error('Error during index migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixMarathonProgressIndex();
