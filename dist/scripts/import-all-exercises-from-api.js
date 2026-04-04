"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
dotenv_1.default.config();
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
const MARATHON_ID = '7dd68a73-14f4-4763-be77-5b4ad63ab545';
const DAY_ID = 'c5707d15-a471-4426-9b0d-a64b4c93050c';
async function importAllExercises() {
    try {
        // Подключаемся к MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Подключено к MongoDB');
        // Получаем данные упражнений из старого API
        console.log('📡 Запрашиваем данные из старого API...');
        const response = await axios_1.default.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
            params: {
                marathonId: MARATHON_ID,
                dayId: DAY_ID,
                timeZoneOffset: -180
            },
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'en'
            }
        });
        // Извлекаем упражнения из dayCategories
        const dayCategories = response.data.marathonDay?.dayCategories || [];
        console.log(`📦 Получено категорий: ${dayCategories.length}`);
        // Собираем все упражнения из всех категорий
        const allExercises = [];
        dayCategories.forEach((category) => {
            if (category.exercises && Array.isArray(category.exercises)) {
                console.log(`  - ${category.categoryName}: ${category.exercises.length} упражнений`);
                allExercises.push(...category.exercises);
            }
        });
        console.log(`📦 Всего упражнений из API: ${allExercises.length}\n`);
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        for (const oldExercise of allExercises) {
            const exerciseName = oldExercise.exerciseName;
            // Проверяем, есть ли упражнение в нашей базе
            let exercise = await Exercise_model_1.default.findOne({ title: exerciseName });
            // Конвертируем exerciseContents в carouselMedia
            const carouselMedia = (oldExercise.exerciseContents || [])
                .filter((content) => content.isActive) // Берем только активные
                .sort((a, b) => a.order - b.order) // Сортируем по order
                .map((content) => {
                // Извлекаем имя файла из URL
                const url = content.contentPath || '';
                const filename = url.split('/').pop() || `${content.type}-${content.order}`;
                return {
                    type: content.type === 'video' ? 'video' : 'image',
                    url: url,
                    filename: filename,
                    order: content.order
                };
            });
            // Создаем краткое описание (первые 200 символов HTML без тегов)
            const htmlContent = oldExercise.exerciseDescription || '';
            const shortDescription = htmlContent
                .replace(/<[^>]*>/g, '') // Удаляем HTML теги
                .replace(/\s+/g, ' ') // Убираем множественные пробелы
                .trim()
                .substring(0, 200);
            if (!exercise) {
                // Создаем новое упражнение
                exercise = new Exercise_model_1.default({
                    title: exerciseName,
                    description: shortDescription,
                    content: htmlContent,
                    carouselMedia: carouselMedia,
                    tags: [],
                    isPublished: true
                });
                await exercise.save();
                console.log(`✨ Создано новое: ${exerciseName} (${carouselMedia.length} медиа)`);
                createdCount++;
            }
            else {
                // Обновляем существующее упражнение
                exercise.content = htmlContent;
                exercise.carouselMedia = carouselMedia;
                // Обновляем description только если оно пустое или короткое
                if (!exercise.description || exercise.description.length < 50) {
                    exercise.description = shortDescription;
                }
                await exercise.save();
                console.log(`♻️  Обновлено: ${exerciseName} (${carouselMedia.length} медиа)`);
                updatedCount++;
            }
        }
        console.log('\n📊 Итого:');
        console.log(`✨ Создано новых: ${createdCount}`);
        console.log(`♻️  Обновлено существующих: ${updatedCount}`);
        console.log(`📝 Всего упражнений в БД: ${await Exercise_model_1.default.countDocuments()}`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.response) {
            console.error('Ответ сервера:', error.response.data);
            console.error('Статус:', error.response.status);
        }
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
importAllExercises();
