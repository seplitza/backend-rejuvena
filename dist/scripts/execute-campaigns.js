"use strict";
/**
 * Execute Email Campaigns
 * Run by PM2 cron job every hour
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const campaign_executor_service_1 = require("../services/campaign-executor.service");
dotenv_1.default.config();
async function executeCampaigns() {
    console.log('========================================');
    console.log('Starting campaign execution:', new Date().toISOString());
    console.log('========================================');
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        // Execute campaigns
        await campaign_executor_service_1.campaignExecutor.processCampaigns();
        console.log('========================================');
        console.log('Campaign execution completed successfully');
        console.log('========================================');
    }
    catch (error) {
        console.error('Error executing campaigns:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    }
}
executeCampaigns();
