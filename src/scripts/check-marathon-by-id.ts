/**
 * Check marathon days by specific ID
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Marathon from '../models/Marathon.model';
import MarathonDay from '../models/MarathonDay.model';

dotenv.config();

const MARATHON_ID = '697dde2ce5bf02ef8d04876d';

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    console.log('🔌 Connecting to MongoDB...');
    console.log('   URI:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find marathon by ID
    const marathon = await Marathon.findById(MARATHON_ID);
    
    if (!marathon) {
      console.log(`❌ Marathon with ID ${MARATHON_ID} not found`);
      process.exit(1);
    }

    console.log(`✅ Found marathon:`);
    console.log(`   Title: ${marathon.title}`);
    console.log(`   ID: ${marathon._id}`);
    console.log(`   Days: ${marathon.numberOfDays}`);
    console.log(`   Language: ${marathon.language}\n`);

    // Get all days for this exact marathon ID
    const days = await MarathonDay.find({ marathonId: MARATHON_ID }).sort({ dayNumber: 1 });
    
    console.log(`📅 Marathon days (${days.length} total):\n`);
    
    if (days.length === 0) {
      console.log('⚠️  No days found for this marathon!\n');
      
      // Check if any days exist with this marathonId as ObjectId
      const daysWithObjectId = await MarathonDay.find({ 
        marathonId: new mongoose.Types.ObjectId(MARATHON_ID) 
      }).sort({ dayNumber: 1 });
      
      console.log(`Checking with ObjectId: ${daysWithObjectId.length} days found\n`);
      
      if (daysWithObjectId.length > 0) {
        daysWithObjectId.forEach(day => {
          const descLength = day.description?.length || 0;
          const descPreview = day.description?.substring(0, 100).replace(/\n/g, ' ') || '(empty)';
          console.log(`Day ${day.dayNumber}:`);
          console.log(`  ID: ${day._id}`);
          console.log(`  marathonId: ${day.marathonId}`);
          console.log(`  Type: ${day.dayType}`);
          console.log(`  Description length: ${descLength} chars`);
          console.log(`  Preview: ${descPreview}${descLength > 100 ? '...' : ''}`);
          console.log('');
        });
      }
    } else {
      days.forEach(day => {
        const descLength = day.description?.length || 0;
        const descPreview = day.description?.substring(0, 100).replace(/\n/g, ' ') || '(empty)';
        console.log(`Day ${day.dayNumber}:`);
        console.log(`  ID: ${day._id}`);
        console.log(`  marathonId: ${day.marathonId}`);
        console.log(`  Type: ${day.dayType}`);
        console.log(`  Description length: ${descLength} chars`);
        console.log(`  Preview: ${descPreview}${descLength > 100 ? '...' : ''}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
