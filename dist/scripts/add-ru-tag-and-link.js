"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const ru_tag_1 = require("./utils/ru-tag");
const en_tag_1 = require("./utils/en-tag");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function addRuTagAndLink() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        const enTag = await (0, en_tag_1.getEnTag)();
        const ruTag = await (0, ru_tag_1.getRuTag)();
        console.log(`✅ Теги: EN (${enTag.color}), RU (${ruTag.color})\n`);
        // Находим все упражнения БЕЗ тега EN (это русские)
        const ruExercises = await Exercise_model_1.default.find({ tags: { $ne: enTag._id } });
        console.log(`📚 Найдено упражнений без тега EN: ${ruExercises.length}`);
        let updated = 0;
        let alreadyHaveRu = 0;
        // Добавляем тег RU к русским упражнениям
        for (const ex of ruExercises) {
            const hasRuTag = ex.tags.some((tagId) => tagId.toString() === ruTag._id.toString());
            if (!hasRuTag) {
                ex.tags.push(ruTag._id);
                await ex.save();
                updated++;
                if (updated <= 5) {
                    console.log(`  ✅ Добавлен RU тег: "${ex.title}"`);
                }
            }
            else {
                alreadyHaveRu++;
            }
        }
        if (updated > 5) {
            console.log(`  ... и ещё ${updated - 5} упражнений`);
        }
        console.log(`\n📊 Результаты:`);
        console.log(`✅ Добавлен RU тег: ${updated}`);
        console.log(`⏭️  Уже имели RU: ${alreadyHaveRu}`);
        console.log(`📦 Всего: ${ruExercises.length}\n`);
        // Теперь находим связи между EN и RU упражнениями
        console.log('🔗 Поиск связей между EN и RU упражнениями...\n');
        const enExercises = await Exercise_model_1.default.find({ tags: enTag._id });
        const ruExercisesWithTags = await Exercise_model_1.default.find({ tags: ruTag._id });
        const links = [];
        for (const enEx of enExercises) {
            const enTagsList = enEx.tags.map((t) => t.toString());
            for (const ruEx of ruExercisesWithTags) {
                const ruTagsList = ruEx.tags.map((t) => t.toString());
                // Ищем общие теги (кроме EN/RU)
                const commonTags = enTagsList.filter((tag) => ruTagsList.includes(tag) &&
                    tag !== enTag._id.toString() &&
                    tag !== ruTag._id.toString());
                // Если есть 2+ общих тега - вероятна связь
                if (commonTags.length >= 2) {
                    links.push({
                        enId: enEx._id.toString(),
                        ruId: ruEx._id.toString(),
                        enTitle: enEx.title,
                        ruTitle: ruEx.title,
                        commonTags: commonTags.length
                    });
                    console.log(`  🔗 "${enEx.title}" ↔ "${ruEx.title}"`);
                    console.log(`     Общих тегов: ${commonTags.length}`);
                    console.log('');
                }
            }
        }
        console.log(`\n📊 Итого найдено связей: ${links.length}\n`);
        // Сохраняем в JSON
        if (links.length > 0) {
            const fs = require('fs');
            const linksPath = './en-ru-exercise-links.json';
            fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));
            console.log(`💾 Связи сохранены в: ${linksPath}\n`);
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
addRuTagAndLink();
