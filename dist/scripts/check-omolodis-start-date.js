"use strict";
/**
 * Check marathon start date and calculate current day
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Marathon_model_1 = __importDefault(require("../models/Marathon.model"));
const MarathonEnrollment_model_1 = __importDefault(require("../models/MarathonEnrollment.model"));
dotenv_1.default.config();
async function main() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
        console.log('🔌 Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        const MARATHON_ID = '697dde2ce5bf02ef8d04876d';
        // Get marathon info
        const marathon = await Marathon_model_1.default.findById(MARATHON_ID);
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
        const enrollments = await MarathonEnrollment_model_1.default.find({ marathonId: MARATHON_ID })
            .populate('userId', 'email fullName')
            .sort({ enrolledAt: -1 })
            .limit(5);
        console.log(`👥 Recent enrollments (${enrollments.length}):`);
        enrollments.forEach((e) => {
            console.log(`  - ${e.userId?.email || 'Unknown'}: Day ${e.currentDay}, lastAccessed: ${e.lastAccessedDay || 'N/A'}`);
        });
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
main();
