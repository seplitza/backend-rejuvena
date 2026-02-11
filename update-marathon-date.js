// Migration script to update marathon start date
// Run on production server: node update-marathon-date.js

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/rejuvena';
const LANDING_SLUG = 'omolodis-stage-7-2280';
const NEW_START_DATE = new Date('2026-02-16T05:00:00.000Z'); // Feb 16, 2026 08:00 MSK

async function updateMarathonDate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const landingsCollection = db.collection('landings');

    console.log(`\nUpdating landing: ${LANDING_SLUG}`);
    console.log(`New start date: ${NEW_START_DATE.toISOString()} (Feb 16, 2026 08:00 MSK)\n`);

    const result = await landingsCollection.updateOne(
      { slug: LANDING_SLUG },
      { $set: { 'marathonsSection.basic.startDate': NEW_START_DATE } }
    );

    console.log('Update result:');
    console.log(`- Matched: ${result.matchedCount}`);
    console.log(`- Modified: ${result.modifiedCount}`);

    if (result.matchedCount === 0) {
      console.log('\n❌ Landing not found! Please check the slug.');
    } else if (result.modifiedCount === 0) {
      console.log('\n⚠️  Landing found but not modified (date might be the same)');
    } else {
      console.log('\n✅ Successfully updated marathon start date!');
    }

    // Verify the update
    const landing = await landingsCollection.findOne(
      { slug: LANDING_SLUG },
      { projection: { slug: 1, title: 1, 'marathonsSection.basic.startDate': 1 } }
    );

    if (landing) {
      console.log('\nVerification:');
      console.log(`- Slug: ${landing.slug}`);
      console.log(`- Title: ${landing.title}`);
      console.log(`- Start Date: ${landing.marathonsSection?.basic?.startDate}`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateMarathonDate();
