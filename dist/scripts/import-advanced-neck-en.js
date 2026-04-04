"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
const en_tag_1 = require("./utils/en-tag");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// ✅ Курс "+Advanced for the Neck" (EN)
const MARATHON_ID = 'fc62d140-17af-4c61-be90-63a6cc656a7b';
const DAY_ID = 'd5f937a7-3030-4006-8b98-a08678b6540f'; // Day 1
// ⚡ ВЫБЕРИТЕ КАТЕГОРИЮ ДЛЯ ИМПОРТА:
// 'Lymphatic drainage' - 3 упражнения (базовые)
// 'Posture' - 9 упражнений (базовые)
// 'Basic massages' - 16 упражнений (базовые)
// 'Advanced for the Neck' - 8 упражнений ⭐ НОВЫЕ ПРОДВИНУТЫЕ!
// 'Sculpting massage' - 3 упражнения (базовые)
// 'Vacuum massage' - 3 упражнения (базовые)
// 'Better in the evening' - 1 упражнение (базовое)
const CATEGORY_SEARCH = 'Advanced for the Neck'; // <-- ИЗМЕНИТЕ ЗДЕСЬ
// Теги для этого курса (настройте под категорию)
const TAG_NAMES = ['Neck', 'Advanced', 'PRO'];
async function importAdvancedNeckEN() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        console.log('📡 Запрашиваем данные из API...');
        console.log(`   Marathon: ${MARATHON_ID}`);
        console.log(`   Day: ${DAY_ID}`);
        console.log(`   Category: "${CATEGORY_SEARCH}"`);
        const response = await axios_1.default.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
            params: {
                marathonId: MARATHON_ID,
                dayId: DAY_ID,
                timeZoneOffset: -180
            },
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'en' // ✅ Английский язык!
            }
        });
        const dayCategories = response.data.marathonDay?.dayCategories || [];
        console.log(`📦 Получено категорий: ${dayCategories.length}`);
        // Показываем доступные категории
        console.log('\n📋 Доступные категории:');
        dayCategories.forEach((cat) => {
            console.log(`   - ${cat.categoryName} (${cat.exercises.length} упражнений)`);
        });
        // ✅ Ищем нужную категорию
        const targetCategory = dayCategories.find((cat) => cat.categoryName.toLowerCase().includes(CATEGORY_SEARCH.toLowerCase()));
        if (!targetCategory) {
            console.log(`\n❌ Категория "${CATEGORY_SEARCH}" не найдена`);
            console.log('Доступные категории:');
            dayCategories.forEach((cat) => console.log(`  - ${cat.categoryName}`));
            return;
        }
        console.log(`\n📂 Выбрана категория: ${targetCategory.categoryName}`);
        console.log(`   Упражнений: ${targetCategory.exercises.length}\n`);
        // ✅ Создаем теги
        const enTag = await (0, en_tag_1.getEnTag)(); // Тег EN (скрытый)
        console.log(`✅ Тег EN: #${enTag.name} (${enTag.color})`);
        const tags = await Promise.all(TAG_NAMES.map(async (name) => {
            let tag = await Tag_model_1.default.findOne({ name });
            if (!tag) {
                tag = await Tag_model_1.default.create({
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-'),
                    color: '#10B981', // Зеленый для EN
                    isVisible: false
                });
                console.log(`✅ Создан тег: #${name}`);
            }
            return tag;
        }));
        tags.push(enTag);
        let imported = 0;
        let skipped = 0;
        // ✅ Импортируем упражнения
        console.log('\n🔄 Начинаем импорт...\n');
        for (const oldExercise of targetCategory.exercises) {
            const exerciseName = oldExercise.exerciseName;
            try {
                // Проверяем существование по названию
                let exercise = await Exercise_model_1.default.findOne({ title: exerciseName });
                if (exercise) {
                    console.log(`⏭️  Пропущено (уже существует): ${exerciseName}`);
                    skipped++;
                    continue;
                }
                // Конвертируем медиа
                const carouselMedia = (oldExercise.exerciseContents || [])
                    .filter((content) => content.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map((content) => {
                    const url = content.contentPath || '';
                    const filename = url.split('/').pop() || `${content.type}-${content.order}`;
                    return {
                        type: content.type === 'video' ? 'video' : 'image',
                        url: url,
                        filename: filename,
                        order: content.order
                    };
                });
                // ✅ Создаем упражнение
                exercise = await Exercise_model_1.default.create({
                    title: exerciseName,
                    description: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
                    content: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
                    carouselMedia: carouselMedia,
                    tags: tags.map(tag => tag._id),
                    duration: oldExercise.marathonExerciseName || '',
                    order: oldExercise.order || 0,
                    category: targetCategory.categoryName
                });
                console.log(`✅ Импортировано: ${exerciseName}`);
                console.log(`   Медиа: ${carouselMedia.length}, Длительность: ${exercise.duration}`);
                imported++;
            }
            catch (error) {
                console.error(`❌ Ошибка при обработке "${exerciseName}":`, error.message);
                skipped++;
            }
        }
        console.log('\n' + '='.repeat(60));
        console.log('📊 РЕЗУЛЬТАТЫ ИМПОРТА');
        console.log('='.repeat(60));
        console.log(`✅ Импортировано:     ${imported}`);
        console.log(`⏭️  Пропущено:        ${skipped}`);
        console.log(`📦 Всего:            ${imported + skipped}`);
        console.log(`🏷️  Теги:             ${tags.map(t => t.name).join(', ')}`);
        console.log(`📂 Категория:        ${targetCategory.categoryName}`);
        console.log('='.repeat(60));
    }
    catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        if (error.response) {
            console.error('Статус:', error.response.status);
            console.error('Данные:', error.response.data);
        }
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('\n👋 Отключено от MongoDB');
    }
}
// Запуск
importAdvancedNeckEN();
