"use strict";
/**
 * Скрипт для переименования тега "нащекииглаза" → "+на щеки и глаза"
 * Также обновляет все упражнения с этим тегом
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function renameTag() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Найти старый тег
        const oldTag = await Tag_model_1.default.findOne({ name: 'нащекииглаза' });
        if (!oldTag) {
            console.log('❌ Тег "нащекииглаза" не найден');
            return;
        }
        console.log(`📌 Найден тег: ${oldTag.name} (ID: ${oldTag._id})`);
        // Переименовать тег
        oldTag.name = '+на щеки и глаза';
        await oldTag.save();
        console.log(`✅ Тег переименован на "${oldTag.name}"`);
        // Найти все упражнения с этим тегом
        const exercises = await Exercise_model_1.default.find({ tags: oldTag._id });
        console.log(`📊 Найдено упражнений с этим тегом: ${exercises.length}`);
        // Готово! Упражнения автоматически получат новое имя тега через populate
        console.log('✅ Готово!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
renameTag();
