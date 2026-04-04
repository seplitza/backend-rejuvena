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
async function updateExerciseTags() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Подключено к MongoDB');
        // Находим или создаем тег "Базовое"
        let baseTag = await Tag_model_1.default.findOne({ name: 'Базовое' });
        if (!baseTag) {
            baseTag = new Tag_model_1.default({
                name: 'Базовое',
                slug: 'bazovoe',
                color: '#3B82F6'
            });
            await baseTag.save();
            console.log('✨ Создан тег "Базовое"');
        }
        else {
            console.log('✅ Тег "Базовое" уже существует');
        }
        // Находим все упражнения
        const exercises = await Exercise_model_1.default.find({});
        console.log(`📝 Найдено упражнений: ${exercises.length}\n`);
        let updatedCount = 0;
        for (const exercise of exercises) {
            // Очищаем все теги
            exercise.tags = [baseTag._id];
            await exercise.save();
            updatedCount++;
            console.log(`✅ Обновлено: ${exercise.title}`);
        }
        console.log('\n📊 Итого:');
        console.log(`✅ Обновлено упражнений: ${updatedCount}`);
        console.log(`🏷️  Всем присвоен тег: "Базовое"`);
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
updateExerciseTags();
