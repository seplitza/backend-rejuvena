"use strict";
/**
 * Check marathon days by specific ID
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Marathon_model_1 = __importDefault(require("../models/Marathon.model"));
const MarathonDay_model_1 = __importDefault(require("../models/MarathonDay.model"));
dotenv_1.default.config();
const MARATHON_ID = '697dde2ce5bf02ef8d04876d';
async function main() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
        console.log('🔌 Connecting to MongoDB...');
        console.log('   URI:', mongoUri);
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Find marathon by ID
        const marathon = await Marathon_model_1.default.findById(MARATHON_ID);
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
        const days = await MarathonDay_model_1.default.find({ marathonId: MARATHON_ID }).sort({ dayNumber: 1 });
        console.log(`📅 Marathon days (${days.length} total):\n`);
        if (days.length === 0) {
            console.log('⚠️  No days found for this marathon!\n');
            // Check if any days exist with this marathonId as ObjectId
            const daysWithObjectId = await MarathonDay_model_1.default.find({
                marathonId: new mongoose_1.default.Types.ObjectId(MARATHON_ID)
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
        }
        else {
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
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
main();
