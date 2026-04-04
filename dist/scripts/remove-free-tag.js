"use strict";
/**
 * Script to remove "Бесплатное" tag from all exercises
 * Usage: ts-node src/scripts/remove-free-tag.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function removeFreeTag() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
        // Find the "Бесплатное" tag
        const freeTag = await Tag_model_1.default.findOne({ name: 'Бесплатное' });
        if (!freeTag) {
            console.log('⚠️ Tag "Бесплатное" not found');
            return;
        }
        console.log(`📋 Found tag "Бесплатное" with ID: ${freeTag._id}`);
        // Find all exercises with this tag
        const exercises = await Exercise_model_1.default.find({ tags: freeTag._id });
        console.log(`📊 Found ${exercises.length} exercises with "Бесплатное" tag`);
        // Remove tag from each exercise
        let updated = 0;
        for (const exercise of exercises) {
            exercise.tags = exercise.tags.filter((tagId) => tagId.toString() !== freeTag._id.toString());
            await exercise.save();
            updated++;
            console.log(`  ✅ ${updated}/${exercises.length}: Removed from "${exercise.title}"`);
        }
        console.log('');
        console.log('✅ Successfully removed "Бесплатное" tag from all exercises!');
        console.log(`📊 Total updated: ${updated} exercises`);
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}
// Run the script
removeFreeTag()
    .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
