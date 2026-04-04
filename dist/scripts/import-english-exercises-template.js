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
// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// ⚠️ НАСТРОЙТЕ ЭТИ ПАРАМЕТРЫ ⚠️
// 
// 💡 КАК НАЙТИ marathonId:
// 1. Откройте https://seplitza.github.io/Rejuvena_old_app/courses
// 2. F12 → Console → найдите "Order #X:" и скопируйте "id"
// 
// ГОТОВЫЕ marathonId АНГЛИЙСКИХ КУРСОВ:
// - Look Younger (Basic):                  8ae4db8b-b256-462a-8918-7e7811243d64
// - +Advanced for the Neck:                fc62d140-17af-4c61-be90-63a6cc656a7b
// - +Advanced for The Forehead and Eyes:   3c33c808-523c-4e60-b284-139e2a136544
// - +Advanced for Mid-face and Eyes:       e7ce939d-b84a-4816-b5bf-ed347646f943
// - 1 goal. Slow down aging:               3efe72d6-aea6-489d-9208-4eaa8979fbd3
const MARATHON_ID = 'YOUR_MARATHON_ID_HERE'; // <-- Вставьте marathonId из списка выше
const DAY_ID = 'YOUR_DAY_ID_HERE'; // <-- Заполните dayId (F12 → Network → getdayexercise)
const COURSE_NAME = 'Advanced Neck'; // <-- Название курса для тегов
const CATEGORY_SEARCH = 'advanced'; // <-- Поисковая строка для категории
async function importEnglishExercises() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        // Получаем данные из API
        console.log('📡 Запрашиваем данные из API...');
        console.log(`   Marathon ID: ${MARATHON_ID}`);
        console.log(`   Day ID: ${DAY_ID}`);
        console.log(`   Language: EN\n`);
        const response = await axios_1.default.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
            params: {
                marathonId: MARATHON_ID,
                dayId: DAY_ID,
                timeZoneOffset: -180
            },
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'en' // ✅ АНГЛИЙСКИЙ ЯЗЫК!
            }
        });
        // Извлекаем упражнения из dayCategories
        const dayCategories = response.data.marathonDay?.dayCategories || [];
        console.log(`📦 Получено категорий: ${dayCategories.length}\n`);
        // Показываем все доступные категории
        console.log('📋 Доступные категории:');
        dayCategories.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.categoryName} (${cat.exercises?.length || 0} упражнений)`);
        });
        console.log('');
        // Ищем целевую категорию
        const targetCategory = dayCategories.find((cat) => cat.categoryName.toLowerCase().includes(CATEGORY_SEARCH.toLowerCase()));
        if (!targetCategory) {
            console.log(`❌ Категория содержащая "${CATEGORY_SEARCH}" не найдена`);
            console.log('💡 Проверьте CATEGORY_SEARCH в начале файла и попробуйте другое название');
            return;
        }
        console.log(`✅ Выбрана категория: ${targetCategory.categoryName}`);
        console.log(`   Упражнений: ${targetCategory.exercises.length}\n`);
        // Создаем/получаем теги
        const enTag = await (0, en_tag_1.getEnTag)(); // Тег EN (скрытый)
        // ⚠️ НАСТРОЙТЕ ТЕГИ ДЛЯ ВАШЕГО КУРСА ⚠️
        const tagNames = ['Advanced', 'Neck', 'PRO']; // Например: ['Basic', 'Face'], ['Advanced', 'Eyes']
        const tags = await Promise.all(tagNames.map(async (name) => {
            let tag = await Tag_model_1.default.findOne({ name });
            if (!tag) {
                tag = await Tag_model_1.default.create({
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/\+/g, ''),
                    color: '#10B981' // Зеленый цвет для EN упражнений
                });
                console.log(`✅ Создан тег: #${name}`);
            }
            return tag;
        }));
        tags.push(enTag);
        console.log(`\n🏷️  Теги для импорта: ${tags.map(t => t.name).join(', ')}\n`);
        let imported = 0;
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
        console.log('\n' + '='.repeat(60));
        console.log('📊 РЕЗУЛЬТАТЫ ИМПОРТА');
        console.log('='.repeat(60));
        console.log(`✅ Импортировано новых упражнений: ${imported}`);
        console.log(`⏭️  Пропущено (уже существует): ${skipped}`);
        console.log(`📦 Всего обработано: ${imported + skipped}`);
        console.log(`🏷️  Теги: ${tags.map(t => `#${t.name}`).join(' ')}`);
        console.log(`🌍 Язык: EN (английский)`);
        console.log(`📂 Категория: ${targetCategory.categoryName}`);
        console.log('='.repeat(60) + '\n');
    }
    catch (error) {
        console.error('❌ ОШИБКА:', error.message);
        if (error.response) {
            console.error('📡 Ответ API:', error.response.status, error.response.statusText);
            console.error('💡 Проверьте OLD_API_TOKEN в .env файле');
        }
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Отключено от MongoDB\n');
    }
}
// Запускаем импорт
importEnglishExercises();
