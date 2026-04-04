"use strict";
/**
 * Check current state of Омолодись marathon days
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
async function main() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
        console.log('🔌 Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Find all Омолодись marathons
        const marathons = await Marathon_model_1.default.find({ title: /омолодись/i });
        if (marathons.length === 0) {
            console.log('❌ No marathons with "Омолодись" found');
            process.exit(1);
        }
        console.log(`✅ Found ${marathons.length} marathon(s):\n`);
        marathons.forEach((m, i) => {
            console.log(`${i + 1}. ${m.title}`);
            console.log(`   ID: ${m._id}`);
            console.log(`   Days: ${m.numberOfDays}`);
            console.log('');
        });
        // Use the first one that has 14 days (the main Омолодись)
        const marathon = marathons.find(m => m.numberOfDays === 14) || marathons[0];
        console.log(`\n🎯 Using: ${marathon.title}`);
        console.log(`   ID: ${marathon._id}`);
        console.log(`   Days: ${marathon.numberOfDays}\n`);
        // Get all days
        const days = await MarathonDay_model_1.default.find({ marathonId: marathon._id }).sort({ dayNumber: 1 });
        console.log(`📅 Marathon days (${days.length} total):\n`);
        days.forEach(day => {
            const descLength = day.description?.length || 0;
            const descPreview = day.description?.substring(0, 100).replace(/\n/g, ' ') || '(empty)';
            console.log(`Day ${day.dayNumber}:`);
            console.log(`  ID: ${day._id}`);
            console.log(`  Type: ${day.dayType}`);
            console.log(`  Description length: ${descLength} chars`);
            console.log(`  Preview: ${descPreview}${descLength > 100 ? '...' : ''}`);
            console.log('');
        });
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
main();
