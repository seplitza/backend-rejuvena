"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const en_tag_1 = require("./utils/en-tag");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function publishEnExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Получаем EN тег
        const enTag = await (0, en_tag_1.getEnTag)();
        console.log(`📌 Тег EN найден: ${enTag._id}\n`);
        // Находим все упражнения с тегом EN которые не опубликованы
        const unpublishedEN = await Exercise_model_1.default.find({
            tags: enTag._id,
            isPublished: false
        });
        console.log(`📋 Найдено неопубликованных EN упражнений: ${unpublishedEN.length}\n`);
        if (unpublishedEN.length === 0) {
            console.log('✅ Все EN упражнения уже опубликованы!');
            return;
        }
        // Публикуем все EN упражнения
        const result = await Exercise_model_1.default.updateMany({ tags: enTag._id, isPublished: false }, { $set: { isPublished: true } });
        console.log(`✅ Опубликовано ${result.modifiedCount} упражнений\n`);
        // Проверяем результат
        const totalEN = await Exercise_model_1.default.countDocuments({ tags: enTag._id });
        const publishedEN = await Exercise_model_1.default.countDocuments({ tags: enTag._id, isPublished: true });
        console.log('📊 Статистика EN упражнений:');
        console.log(`   Всего: ${totalEN}`);
        console.log(`   Опубликовано: ${publishedEN}`);
        console.log(`   Не опубликовано: ${totalEN - publishedEN}`);
    }
    catch (error) {
        console.error('\n❌ ОШИБКА:', error);
        throw error;
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}
publishEnExercises()
    .then(() => {
    console.log('\n🎉 Скрипт завершен успешно!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Скрипт завершен с ошибкой:', error.message);
    process.exit(1);
});
