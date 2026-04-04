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
async function checkEnExercises() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Находим тег EN
        const enTag = await Tag_model_1.default.findOne({ slug: 'en' });
        const ruTag = await Tag_model_1.default.findOne({ slug: 'ru' });
        if (!enTag) {
            console.log('❌ Тег EN не найден!');
            return;
        }
        console.log(`✅ Тег EN найден: ${enTag.name} (${enTag.color}, visible: ${enTag.isVisible})\n`);
        // Все упражнения с тегом EN
        const enExercises = await Exercise_model_1.default.find({ tags: enTag._id });
        console.log(`📚 Всего EN упражнений: ${enExercises.length}\n`);
        if (enExercises.length > 0) {
            console.log('📝 Список EN упражнений:\n');
            for (const ex of enExercises) {
                const tags = await Tag_model_1.default.find({ _id: { $in: ex.tags } });
                const tagNames = tags.map(t => t.name).join(', ');
                console.log(`   ${ex.title}`);
                console.log(`   Категория: ${ex.category || 'Не указана'}`);
                console.log(`   Теги: ${tagNames}`);
                console.log('');
            }
        }
        // Статистика
        const total = await Exercise_model_1.default.countDocuments();
        const ruCount = await Exercise_model_1.default.countDocuments({ tags: ruTag?._id });
        console.log('📊 СТАТИСТИКА:');
        console.log(`   Всего упражнений: ${total}`);
        console.log(`   RU упражнений: ${ruCount}`);
        console.log(`   EN упражнений: ${enExercises.length}`);
        console.log(`   Без языка: ${total - ruCount - enExercises.length}`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('\n👋 Отключено от MongoDB');
    }
}
checkEnExercises();
