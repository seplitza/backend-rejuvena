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
// Маппинг названий упражнений на длительность из JSON
const DURATIONS = {
    // PRO на шею
    'Разволокнение задней поверхности шеи': '2-5 минут',
    'Вращения головой с акцентом на растяжение': '5 в каждую сторону',
    // PRO на лоб и глаза
    'Лифтинг лба, бровей и верхних век': '2-3 минуты',
    'Массаж межбровья': '2-3 минуты',
    'Прокатывание складочки': '2-5 минут',
    'Стирание морщин на лбу PRO': '1 минута',
};
async function updateDurations() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        const tag = await Tag_model_1.default.findOne({ name: '+на_лоб_и_глаза' });
        if (!tag) {
            console.log('❌ Тег "+на_лоб_и_глаза" не найден');
            return;
        }
        const exercises = await Exercise_model_1.default.find({ tags: tag._id });
        console.log(`📦 Найдено упражнений: ${exercises.length}\n`);
        let updated = 0;
        for (const exercise of exercises) {
            const duration = DURATIONS[exercise.title];
            if (duration && (!exercise.duration || exercise.duration === '')) {
                exercise.duration = duration;
                await exercise.save();
                console.log(`✅ Обновлено: ${exercise.title} → ${duration}`);
                updated++;
            }
            else if (duration && exercise.duration) {
                console.log(`⏭️  Пропущено (уже есть длительность): ${exercise.title}`);
            }
            else {
                console.log(`⚠️  Нет данных о длительности: ${exercise.title}`);
            }
        }
        console.log(`\n📊 Обновлено: ${updated} упражнений`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
updateDurations().catch(console.error);
