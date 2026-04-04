"use strict";
/**
 * Скрипт для удаления тегов "Продвинутый" и "продвинутое" из всех упражнений
 * Эти теги дублируют тег "PRO", поэтому удаляются
 *
 * Использование:
 * ts-node src/scripts/remove-advanced-tags.ts
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function removeAdvancedTags() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Найти теги для удаления
        const tagsToRemove = await Tag_model_1.default.find({
            name: { $in: ['Продвинутый', 'продвинутое'] }
        });
        console.log(`📌 Найдено тегов для удаления: ${tagsToRemove.length}`);
        tagsToRemove.forEach(tag => {
            console.log(`   - ${tag.name} (ID: ${tag._id})`);
        });
        if (tagsToRemove.length === 0) {
            console.log('ℹ️  Теги не найдены, возможно уже удалены');
            await mongoose_1.default.disconnect();
            process.exit(0);
            return;
        }
        const tagIds = tagsToRemove.map(t => t._id);
        // Найти все упражнения с этими тегами
        const exercisesWithTags = await Exercise_model_1.default.find({ tags: { $in: tagIds } });
        console.log(`📊 Найдено упражнений с этими тегами: ${exercisesWithTags.length}\n`);
        if (exercisesWithTags.length > 0) {
            console.log('🔄 Удаляем теги из упражнений...');
            // Удалить теги из упражнений
            let updatedCount = 0;
            for (const exercise of exercisesWithTags) {
                const originalTagCount = exercise.tags.length;
                exercise.tags = exercise.tags.filter((tagId) => !tagIds.some(removeId => removeId.equals(tagId)));
                if (exercise.tags.length < originalTagCount) {
                    await exercise.save();
                    updatedCount++;
                    console.log(`  ✅ Очищено: ${exercise.title}`);
                }
            }
            console.log(`\n✅ Обновлено упражнений: ${updatedCount}`);
        }
        // Удалить теги из базы данных
        const result = await Tag_model_1.default.deleteMany({ _id: { $in: tagIds } });
        console.log(`🗑️  Удалено тегов из базы: ${result.deletedCount}\n`);
        console.log('✅ Готово! Теги "Продвинутый" и "продвинутое" успешно удалены.');
        await mongoose_1.default.disconnect();
        console.log('👋 Отключено от MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
removeAdvancedTags();
