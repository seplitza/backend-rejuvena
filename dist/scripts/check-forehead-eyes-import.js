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
async function checkImportedExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Находим тег "+на_лоб_и_глаза"
        const tag = await Tag_model_1.default.findOne({ name: '+на_лоб_и_глаза' });
        if (!tag) {
            console.log('❌ Тег "+на_лоб_и_глаза" не найден');
            return;
        }
        console.log(`✅ Найден тег: ${tag.name} (ID: ${tag._id})\n`);
        // Находим все упражнения с этим тегом
        const exercises = await Exercise_model_1.default.find({ tags: tag._id })
            .populate('tags', 'name')
            .sort({ category: 1, order: 1 });
        console.log(`📦 Найдено упражнений с тегом "+на_лоб_и_глаза": ${exercises.length}\n`);
        // Группируем по категориям
        const byCategory = {};
        exercises.forEach(ex => {
            const cat = ex.category || 'Без категории';
            if (!byCategory[cat]) {
                byCategory[cat] = [];
            }
            byCategory[cat].push(ex);
        });
        // Выводим информацию
        Object.entries(byCategory).forEach(([category, exs]) => {
            console.log(`📂 ${category} (${exs.length} упражнений):`);
            exs.forEach((ex, idx) => {
                const tags = ex.tags.map((t) => `#${t.name}`).join(', ');
                const mediaCount = ex.carouselMedia?.length || 0;
                console.log(`   ${idx + 1}. ${ex.title}`);
                console.log(`      Теги: ${tags}`);
                console.log(`      Медиа: ${mediaCount} файлов`);
                console.log(`      Длительность: ${ex.duration || 'не указана'}`);
            });
            console.log('');
        });
        // Общая статистика по тегам
        console.log('\n📊 Статистика по тегам:');
        const allTags = await Tag_model_1.default.find();
        for (const tag of allTags) {
            const count = await Exercise_model_1.default.countDocuments({ tags: tag._id });
            if (count > 0) {
                console.log(`   #${tag.name}: ${count} упражнений`);
            }
        }
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
checkImportedExercises().catch(console.error);
