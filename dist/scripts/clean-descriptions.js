"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
dotenv_1.default.config();
const cleanDescription = (text) => {
    let cleaned = text;
    // Удаляем эмодзи и специальные символы Unicode
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Эмодзи
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Разные символы
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
    // Удаляем множественные пробелы и переносы строк
    cleaned = cleaned.replace(/\s+/g, ' ');
    // Убираем пробелы в начале и конце
    cleaned = cleaned.trim();
    return cleaned;
};
async function cleanExerciseDescriptions() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Подключено к MongoDB');
        const exercises = await Exercise_model_1.default.find({});
        console.log(`📝 Найдено упражнений: ${exercises.length}`);
        let updatedCount = 0;
        let unchangedCount = 0;
        for (const exercise of exercises) {
            const originalDescription = exercise.description;
            const cleanedDescription = cleanDescription(originalDescription);
            if (originalDescription !== cleanedDescription) {
                exercise.description = cleanedDescription;
                await exercise.save();
                updatedCount++;
                console.log(`✏️  Обновлено: "${exercise.title}"`);
                console.log(`   Было: "${originalDescription.substring(0, 100)}..."`);
                console.log(`   Стало: "${cleanedDescription.substring(0, 100)}..."`);
            }
            else {
                unchangedCount++;
            }
        }
        console.log('\n📊 Результаты:');
        console.log(`✅ Обновлено: ${updatedCount}`);
        console.log(`⏭️  Без изменений: ${unchangedCount}`);
        await mongoose_1.default.disconnect();
        console.log('👋 Отключено от MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
cleanExerciseDescriptions();
