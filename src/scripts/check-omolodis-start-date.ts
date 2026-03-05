/**
 * Check marathon start date and calculate current day
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Marathon from '../models/Marathon.model';
import MarathonEnrollment from '../models/MarathonEnrollment.model';

dotenv.config();

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const MARATHON_ID = '697dde2ce5bf02ef8d04876d';

    // Get marathon info
    const marathon = await Marathon.findById(MARATHON_ID);
    
    if (!marathon) {
      console.log('❌ Marathon not found');
      process.exit(1);
    }

    console.log(`📋 Marathon: ${marathon.title}`);
    console.log(`   ID: ${marathon._id}`);
    console.log(`   Start Date: ${marathon.startDate}`);
    console.log(`   Total Days: ${marathon.numberOfDays}`);
    console.log('');

    // Calculate current day based on start date
    const now = new Date();
    const startDate = new Date(marathon.startDate);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = daysSinceStart + 1;

    console.log(`📅 Calculation:`);
    console.log(`   Today: ${now.toLocaleDateString('ru-RU')}`);
    console.log(`   Start: ${startDate.toLocaleDateString('ru-RU')}`);
    console.log(`   Days since start: ${daysSinceStart}`);
    console.log(`   Current day should be: ${currentDay}`);
    console.log('');

    // Check enrollments
    const enrollments = await MarathonEnrollment.find({ marathonId: MARATHON_ID })
      .populate('userId', 'email fullName')
      .sort({ enrolledAt: -1 })
      .limit(5);

    console.log(`👥 Recent enrollments (${enrollments.length}):`);
    enrollments.forEach((e: any) => {
      console.log(`  - ${e.userId?.email || 'Unknown'}: Day ${e.currentDay}, lastAccessed: ${e.lastAccessedDay || 'N/A'}`);
    });

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
