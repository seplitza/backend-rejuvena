"use strict";
/**
 * Скрипт для удаления неиспользуемых тегов
 * Удаляет теги: Йога, Пилатес, Растяжка, Эксперт
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
async function removeUnusedTags() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        const tagsToRemove = ['Йога', 'Пилатес', 'Растяжка', 'Эксперт'];
        // Найти эти теги
        const tags = await Tag_model_1.default.find({ name: { $in: tagsToRemove } });
        console.log(`📌 Найдено тегов для удаления: ${tags.length}`);
        if (tags.length === 0) {
            console.log('ℹ️  Теги не найдены, возможно уже удалены');
            process.exit(0);
            return;
        }
        const tagIds = tags.map(t => t._id);
        // Проверить используются ли эти теги
        const exercisesWithTags = await Exercise_model_1.default.find({ tags: { $in: tagIds } });
        if (exercisesWithTags.length > 0) {
            console.log(`⚠️  Внимание! Найдено упражнений с этими тегами: ${exercisesWithTags.length}`);
            console.log('Удаляем теги из упражнений...');
            // Удалить теги из упражнений
            for (const exercise of exercisesWithTags) {
                exercise.tags = exercise.tags.filter((tagId) => !tagIds.some(removeId => removeId.equals(tagId)));
                await exercise.save();
                console.log(`  ✅ Очищено: ${exercise.title}`);
            }
        }
        // Удалить теги из базы
        const result = await Tag_model_1.default.deleteMany({ _id: { $in: tagIds } });
        console.log(`🗑️  Удалено тегов: ${result.deletedCount}`);
        tags.forEach(tag => {
            console.log(`  - ${tag.name}`);
        });
        console.log('✅ Все готово!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
removeUnusedTags();
