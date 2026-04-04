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
async function checkExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Проверяем теги
        const tags = await Tag_model_1.default.find({});
        console.log(`📊 Всего тегов в БД: ${tags.length}`);
        tags.forEach(tag => {
            console.log(`   - ${tag.name} (ID: ${tag._id})`);
        });
        // Проверяем упражнения
        const allExercises = await Exercise_model_1.default.find({}).populate('tags');
        console.log(`\n📊 Всего упражнений в БД: ${allExercises.length}\n`);
        // Ищем упражнения с тегом "+на_лоб_и_глаза"
        const foreheadTag = await Tag_model_1.default.findOne({ name: '+на_лоб_и_глаза' });
        if (foreheadTag) {
            const foreheadExercises = await Exercise_model_1.default.find({ tags: foreheadTag._id }).populate('tags');
            console.log(`🔍 Упражнений с тегом "+на_лоб_и_глаза": ${foreheadExercises.length}`);
            foreheadExercises.forEach((ex, idx) => {
                console.log(`\n${idx + 1}. ${ex.title}`);
                console.log(`   ID: ${ex._id}`);
                console.log(`   Category: ${ex.category}`);
                console.log(`   Duration: ${ex.duration || 'не указано'}`);
                console.log(`   Premium: ${ex.isPremium ? 'Да' : 'Нет'}`);
                console.log(`   Published: ${ex.isPublished ? 'Да' : 'Нет'}`);
                console.log(`   Media: ${ex.carouselMedia?.length || 0} файлов`);
                console.log(`   Tags: ${ex.tags.map((t) => t.name).join(', ')}`);
            });
        }
        else {
            console.log('❌ Тег "+на_лоб_и_глаза" не найден');
        }
        // Проверяем последние 10 добавленных упражнений
        const recentExercises = await Exercise_model_1.default.find({}).sort({ createdAt: -1 }).limit(10).populate('tags');
        console.log(`\n\n📅 Последние 10 добавленных упражнений:`);
        recentExercises.forEach((ex, idx) => {
            console.log(`\n${idx + 1}. ${ex.title}`);
            console.log(`   Создано: ${ex.createdAt}`);
            console.log(`   Category: ${ex.category}`);
            console.log(`   Tags: ${ex.tags.map((t) => t.name).join(', ')}`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
checkExercises().catch(console.error);
