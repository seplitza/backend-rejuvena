/**
 * Execute Email Campaigns
 * Run by PM2 cron job every hour
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { campaignExecutor } from '../services/campaign-executor.service';

dotenv.config();

async function executeCampaigns() {
  console.log('========================================');
  console.log('Starting campaign execution:', new Date().toISOString());
  console.log('========================================');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Execute campaigns
    await campaignExecutor.processCampaigns();

    console.log('========================================');
    console.log('Campaign execution completed successfully');
    console.log('========================================');
  } catch (error: any) {
    console.error('Error executing campaigns:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

executeCampaigns();
