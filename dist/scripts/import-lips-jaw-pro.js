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
const ru_tag_1 = require("./utils/ru-tag");
dotenv_1.default.config();
// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// Курс "+на губы и челюсть"
const MARATHON_ID = 'b9a10637-8b1e-478d-940c-4d239e53831e';
const DAY_ID = 'cf557c27-45de-424c-8bdc-58243ff66051'; // День 8
async function importLipsJawPro() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        // Получаем данные из API
        console.log('📡 Запрашиваем данные из API...');
        const response = await axios_1.default.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
            params: {
                marathonId: MARATHON_ID,
                dayId: DAY_ID,
                timeZoneOffset: -180
            },
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'ru'
            }
        });
        // Извлекаем упражнения из dayCategories
        const dayCategories = response.data.marathonDay?.dayCategories || [];
        console.log(`📦 Получено категорий: ${dayCategories.length}`);
        // Ищем категорию "+на рот и челюсть"
        const targetCategory = dayCategories.find((cat) => cat.categoryName.toLowerCase().includes('рот') &&
            cat.categoryName.toLowerCase().includes('челюсть'));
        if (!targetCategory) {
            console.log('❌ Категория "+на рот и челюсть" не найдена');
            console.log('Доступные категории:');
            dayCategories.forEach((cat) => console.log(`  - ${cat.categoryName}`));
            return;
        }
        console.log(`📂 Категория: ${targetCategory.categoryName} (${targetCategory.exercises.length} упражнений)\n`);
        // Создаем/получаем теги
        const ruTag = await (0, ru_tag_1.getRuTag)();
        const tagNames = ['+на губы и челюсть', 'PRO'];
        const tags = await Promise.all(tagNames.map(async (name) => {
            let tag = await Tag_model_1.default.findOne({ name });
            if (!tag) {
                tag = await Tag_model_1.default.create({
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, ''),
                    color: '#F59E0B' // Оранжевый цвет
                });
                console.log(`✅ Создан тег: #${name}`);
            }
            return tag;
        }));
        tags.push(ruTag);
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        // Импортируем упражнения из API
        for (const oldExercise of targetCategory.exercises) {
            const exerciseName = oldExercise.exerciseName;
            try {
                // Проверяем, существует ли упражнение с таким именем
                let exercise = await Exercise_model_1.default.findOne({ title: exerciseName });
                // Если упражнение уже существует, пропускаем его
                if (exercise) {
                    console.log(`⏭️  Пропущено (уже существует): ${exerciseName}`);
                    skipped++;
                    continue;
                }
                // Конвертируем exerciseContents в carouselMedia
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
                // Создаем новое упражнение
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
                console.log(`✅ Импортировано: ${exerciseName} (${carouselMedia.length} медиа)`);
                imported++;
            }
            catch (error) {
                console.error(`❌ Ошибка при обработке "${exerciseName}":`, error.message);
                skipped++;
            }
        }
        console.log('\n📊 Результаты импорта:');
        console.log(`✅ Импортировано новых: ${imported}`);
        console.log(`⏭️  Пропущено (уже существует): ${skipped}`);
        console.log(`📦 Всего обработано: ${imported + skipped}`);
        console.log('\n📝 Категория: +на рот и челюсть');
        console.log('Упражнения проверены на существование и импортированы только новые');
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('\n👋 Отключено от MongoDB');
    }
}
// Запускаем импорт
importLipsJawPro();
