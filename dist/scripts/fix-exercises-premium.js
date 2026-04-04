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
async function fixExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Находим тег "На осанку"
        const postureTag = await Tag_model_1.default.findOne({ name: 'На осанку' });
        // Обновляем ВСЕ упражнения
        const allExercises = await Exercise_model_1.default.find({}).populate('tags');
        let updated = 0;
        let published = 0;
        for (const exercise of allExercises) {
            let needUpdate = false;
            // Проверяем, есть ли тег "На осанку"
            const hasPostureTag = postureTag && exercise.tags.some((tag) => tag._id.toString() === postureTag._id.toString());
            // Все упражнения с тегом "На осанку" - бесплатные
            // Все остальные - платные
            const shouldBePremium = !hasPostureTag;
            if (exercise.isPremium !== shouldBePremium) {
                exercise.isPremium = shouldBePremium;
                needUpdate = true;
            }
            // Публикуем все упражнения
            if (!exercise.isPublished) {
                exercise.isPublished = true;
                needUpdate = true;
                published++;
            }
            if (needUpdate) {
                await exercise.save();
                updated++;
                const premiumStatus = shouldBePremium ? '💰 Платное' : '🆓 Бесплатное';
                console.log(`✅ ${exercise.title}`);
                console.log(`   ${premiumStatus}, Опубликовано`);
            }
        }
        console.log(`\n📊 Итого:`);
        console.log(`   Обновлено: ${updated} упражнений`);
        console.log(`   Опубликовано: ${published} упражнений`);
        // Статистика
        const freeCount = await Exercise_model_1.default.countDocuments({ isPremium: false });
        const premiumCount = await Exercise_model_1.default.countDocuments({ isPremium: true });
        const publishedCount = await Exercise_model_1.default.countDocuments({ isPublished: true });
        console.log(`\n📈 Финальная статистика:`);
        console.log(`   🆓 Бесплатных: ${freeCount}`);
        console.log(`   💰 Платных: ${premiumCount}`);
        console.log(`   ✅ Опубликованных: ${publishedCount}`);
        console.log(`   📦 Всего: ${freeCount + premiumCount}`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
fixExercises().catch(console.error);
