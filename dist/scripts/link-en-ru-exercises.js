"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const en_tag_1 = require("./utils/en-tag");
const ru_tag_1 = require("./utils/ru-tag");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
/**
 * Скрипт для связывания английских и русских упражнений
 * Находит пары упражнений по общим тегам
 */
async function linkEnRuExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Получаем теги EN и RU
        const enTag = await (0, en_tag_1.getEnTag)();
        const ruTag = await (0, ru_tag_1.getRuTag)();
        console.log('🔍 Поиск упражнений...\n');
        // Получаем все английские упражнения
        const enExercises = await Exercise_model_1.default.find({ tags: enTag._id }).populate('tags');
        console.log(`📗 Найдено английских упражнений: ${enExercises.length}`);
        // Получаем все русские упражнения
        const ruExercises = await Exercise_model_1.default.find({ tags: ruTag._id }).populate('tags');
        console.log(`📕 Найдено русских упражнений: ${ruExercises.length}\n`);
        if (enExercises.length === 0 || ruExercises.length === 0) {
            console.log('❌ Недостаточно упражнений для связывания');
            return;
        }
        console.log('='.repeat(100));
        console.log('🔗 ПОИСК СВЯЗЕЙ МЕЖДУ УПРАЖНЕНИЯМИ');
        console.log('='.repeat(100) + '\n');
        let potentialLinks = 0;
        const links = [];
        // Анализируем каждое английское упражнение
        for (const enEx of enExercises) {
            const enExTags = enEx.tags.map((t) => t._id.toString());
            const enTagNames = enEx.tags.map((t) => t.name);
            let bestMatch = null;
            let bestScore = 0;
            let bestCommonTags = [];
            // Ищем лучшее совпадение среди русских упражнений
            for (const ruEx of ruExercises) {
                const ruExTags = ruEx.tags.map((t) => t._id.toString());
                const ruTagNames = ruEx.tags.map((t) => t.name);
                // Находим общие теги (исключая EN/RU)
                const commonTagIds = enExTags.filter(tag => ruExTags.includes(tag) &&
                    tag !== enTag._id.toString() &&
                    tag !== ruTag._id.toString());
                const commonTagNames = enTagNames.filter((name) => ruTagNames.includes(name) &&
                    name !== 'EN' &&
                    name !== 'RU');
                // Вычисляем score (количество общих тегов)
                const score = commonTagIds.length;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = ruEx;
                    bestCommonTags = commonTagNames;
                }
            }
            // Если найдено совпадение с 2+ общими тегами
            if (bestScore >= 2 && bestMatch) {
                potentialLinks++;
                links.push({
                    en: enEx,
                    ru: bestMatch,
                    score: bestScore,
                    commonTags: bestCommonTags
                });
                console.log(`${potentialLinks}. 🔗 ПОТЕНЦИАЛЬНАЯ СВЯЗЬ (score: ${bestScore})`);
                console.log(`   EN: "${enEx.title}"`);
                console.log(`   RU: "${bestMatch.title}"`);
                console.log(`   Общие теги: ${bestCommonTags.map((t) => `#${t}`).join(', ')}`);
                console.log(`   EN media: ${enEx.carouselMedia?.length || 0} | RU media: ${bestMatch.carouselMedia?.length || 0}`);
                console.log('');
            }
        }
        console.log('='.repeat(100));
        console.log('📊 ИТОГО');
        console.log('='.repeat(100));
        console.log(`✅ Найдено потенциальных связей: ${potentialLinks}`);
        console.log(`📗 Всего EN упражнений: ${enExercises.length}`);
        console.log(`📕 Всего RU упражнений: ${ruExercises.length}`);
        console.log(`📈 Процент покрытия: ${((potentialLinks / enExercises.length) * 100).toFixed(1)}%\n`);
        // ⚠️ АВТОМАТИЧЕСКОЕ СВЯЗЫВАНИЕ ЗАКОММЕНТИРОВАНО ⚠️
        // Раскомментируйте код ниже, чтобы автоматически создать связи
        /*
        console.log('💾 Сохранение связей...\n');
        
        for (const link of links) {
          // Добавляем поле relatedExercise (если оно есть в модели)
          // Или создаем отдельную коллекцию ExerciseLinks
          
          // Пример 1: Если в модели Exercise есть поле relatedExercise
          // link.en.relatedExercise = link.ru._id;
          // link.ru.relatedExercise = link.en._id;
          // await link.en.save();
          // await link.ru.save();
          
          // Пример 2: Или создать отдельную коллекцию
          // await ExerciseLink.create({
          //   enExercise: link.en._id,
          //   ruExercise: link.ru._id,
          //   score: link.score
          // });
          
          console.log(`✅ Связано: "${link.en.title}" ↔ "${link.ru.title}"`);
        }
        
        console.log(`\n✅ Сохранено связей: ${links.length}`);
        */
        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        console.log('   1. Проверьте предложенные связи вручную');
        console.log('   2. При необходимости добавьте поле relatedExercise в модель Exercise');
        console.log('   3. Раскомментируйте код сохранения связей в этом скрипте');
        console.log('   4. Запустите скрипт снова для сохранения связей\n');
        // Экспорт в JSON для ручной проверки
        const exportData = links.map(l => ({
            en_title: l.en.title,
            en_id: l.en._id.toString(),
            ru_title: l.ru.title,
            ru_id: l.ru._id.toString(),
            score: l.score,
            common_tags: l.commonTags.join(', ')
        }));
        const fs = require('fs');
        const exportPath = './exercise-links-export.json';
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
        console.log(`📁 Экспортировано в ${exportPath}\n`);
    }
    catch (error) {
        console.error('❌ ОШИБКА:', error.message);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Отключено от MongoDB\n');
    }
}
// Запускаем связывание
linkEnRuExercises();
