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
async function addRuTagToAllExercises() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Найти или создать тег RU
        let ruTag = await Tag_model_1.default.findOne({ name: 'RU' });
        if (!ruTag) {
            ruTag = await Tag_model_1.default.create({
                name: 'RU',
                slug: 'ru',
                description: 'Упражнения на русском языке',
                isVisible: false // Скрыть тег от отображения во фронтенде
            });
            console.log('✅ Создан тег RU');
        }
        else {
            // Убедимся, что тег скрыт
            ruTag.isVisible = false;
            await ruTag.save();
            console.log('✅ Тег RU найден и настроен как скрытый');
        }
        // Найти все упражнения, у которых нет тега RU
        const exercises = await Exercise_model_1.default.find({
            tags: { $ne: ruTag._id }
        });
        console.log(`📊 Найдено ${exercises.length} упражнений без тега RU`);
        let updated = 0;
        for (const exercise of exercises) {
            exercise.tags.push(ruTag._id);
            await exercise.save();
            updated++;
            if (updated % 10 === 0) {
                console.log(`⏳ Обработано ${updated}/${exercises.length} упражнений`);
            }
        }
        console.log(`✅ Добавлен тег RU к ${updated} упражнениям`);
        // Показать статистику
        const totalWithRuTag = await Exercise_model_1.default.countDocuments({
            tags: ruTag._id
        });
        console.log(`📊 Всего упражнений с тегом RU: ${totalWithRuTag}`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('👋 Отключено от MongoDB');
    }
}
addRuTagToAllExercises();
