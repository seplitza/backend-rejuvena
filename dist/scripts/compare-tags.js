"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function compareTags() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Английские Advanced для шеи
        console.log('🇬🇧 АНГЛИЙСКИЕ "Advanced for the Neck":');
        const enNeckExercises = await Exercise_model_1.default.find({ category: 'Advanced for the Neck' });
        for (const ex of enNeckExercises) {
            const tags = await Tag_model_1.default.find({ _id: { $in: ex.tags } });
            const tagNames = tags.map(t => t.name).join(', ');
            console.log(`   📝 ${ex.title}`);
            console.log(`      Теги: ${tagNames}\n`);
        }
        // Русские PRO на шею
        console.log('\n🇷🇺 РУССКИЕ "PRO на шею":');
        const ruNeckExercises = await Exercise_model_1.default.find({ category: 'PRO на шею' });
        for (const ex of ruNeckExercises) {
            const tags = await Tag_model_1.default.find({ _id: { $in: ex.tags } });
            const tagNames = tags.map(t => t.name).join(', ');
            console.log(`   📝 ${ex.title}`);
            console.log(`      Теги: ${tagNames}\n`);
        }
        // Все теги в базе
        console.log('\n🏷️  Все теги в базе:');
        const allTags = await Tag_model_1.default.find().sort({ name: 1 });
        allTags.forEach(tag => {
            console.log(`   ${tag.name} (${tag.slug}) - ${tag.color} ${tag.isVisible ? '👁️' : '🔒'}`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('\n👋 Отключено от MongoDB');
    }
}
compareTags();
