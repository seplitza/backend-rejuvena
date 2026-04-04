"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function exportExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Находим тег "+на_лоб_и_глаза"
        const foreheadTag = await Tag_model_1.default.findOne({ name: '+на_лоб_и_глаза' });
        if (!foreheadTag) {
            console.log('❌ Тег "+на_лоб_и_глаза" не найден');
            return;
        }
        // Получаем упражнения
        const exercises = await Exercise_model_1.default.find({ tags: foreheadTag._id })
            .populate('tags')
            .lean();
        console.log(`📦 Найдено упражнений: ${exercises.length}\n`);
        // Преобразуем для экспорта (заменяем ObjectId на названия тегов)
        const exportData = exercises.map(ex => ({
            title: ex.title,
            description: ex.description,
            content: ex.content,
            duration: ex.duration || '',
            carouselMedia: ex.carouselMedia,
            category: ex.category,
            isPremium: ex.isPremium,
            isPublished: ex.isPublished,
            tagNames: ex.tags.map((t) => t.name)
        }));
        // Сохраняем в JSON
        const json = JSON.stringify(exportData, null, 2);
        fs_1.default.writeFileSync('/tmp/exercises-export.json', json);
        console.log('✅ Экспортировано в /tmp/exercises-export.json');
        console.log('\nУпражнения:');
        exportData.forEach((ex, idx) => {
            console.log(`${idx + 1}. ${ex.title} (${ex.duration})`);
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
exportExercises().catch(console.error);
