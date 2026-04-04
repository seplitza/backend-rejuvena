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
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        const total = await Exercise_model_1.default.countDocuments();
        console.log(`📊 Всего упражнений в базе: ${total}\n`);
        // Группируем по категориям
        const byCategory = await Exercise_model_1.default.aggregate([
            { $group: { _id: '$category', count: { $count: {} } } },
            { $sort: { count: -1 } }
        ]);
        console.log('📂 По категориям:');
        byCategory.forEach((cat) => {
            console.log(`   ${cat._id || 'Без категории'}: ${cat.count}`);
        });
        // Новые английские упражнения
        console.log('\n🆕 Последние импортированные упражнения:');
        const recent = await Exercise_model_1.default.find()
            .sort({ _id: -1 })
            .limit(10);
        for (const ex of recent) {
            const tags = await Tag_model_1.default.find({ _id: { $in: ex.tags } });
            const tagNames = tags.map((t) => t.name).join(', ');
            console.log(`   📝 ${ex.title}`);
            console.log(`      Категория: ${ex.category || 'Не указана'}`);
            console.log(`      Теги: ${tagNames}`);
            console.log(`      Медиа: ${ex.carouselMedia?.length || 0}`);
            console.log('');
        }
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Отключено от MongoDB');
    }
}
checkExercises();
