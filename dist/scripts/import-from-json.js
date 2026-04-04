"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function importFromJson() {
    try {
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Читаем JSON файл
        const jsonPath = process.argv[2] || '/tmp/exercises-export.json';
        console.log(`📄 Читаем файл: ${jsonPath}`);
        if (!fs_1.default.existsSync(jsonPath)) {
            console.log('❌ Файл не найден:', jsonPath);
            return;
        }
        const jsonData = fs_1.default.readFileSync(jsonPath, 'utf-8');
        const exercisesData = JSON.parse(jsonData);
        console.log(`📦 Найдено упражнений в файле: ${exercisesData.length}\n`);
        let imported = 0;
        let skipped = 0;
        let updated = 0;
        for (const data of exercisesData) {
            // Проверяем, существует ли упражнение
            const existing = await Exercise_model_1.default.findOne({ title: data.title });
            if (existing) {
                console.log(`⏭️  Пропускаем (уже существует): ${data.title}`);
                skipped++;
                continue;
            }
            // Получаем или создаем теги
            const tagIds = [];
            for (const tagName of data.tagNames) {
                let tag = await Tag_model_1.default.findOne({ name: tagName });
                if (!tag) {
                    // Создаем новый тег
                    tag = new Tag_model_1.default({
                        name: tagName,
                        slug: tagName.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-'),
                        color: '#' + Math.floor(Math.random() * 16777215).toString(16)
                    });
                    await tag.save();
                    console.log(`   ✨ Создан новый тег: ${tagName}`);
                }
                tagIds.push(tag._id);
            }
            // Создаем упражнение
            const exercise = new Exercise_model_1.default({
                title: data.title,
                description: data.description,
                content: data.content,
                duration: data.duration,
                carouselMedia: data.carouselMedia,
                category: data.category,
                isPremium: data.isPremium,
                isPublished: data.isPublished,
                tags: tagIds
            });
            await exercise.save();
            console.log(`✅ Импортировано: ${data.title} (${data.duration})`);
            imported++;
        }
        console.log('\n📊 Статистика:');
        console.log(`   ✅ Импортировано: ${imported}`);
        console.log(`   ⏭️  Пропущено: ${skipped}`);
        console.log(`   🔄 Обновлено: ${updated}`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error(error.stack);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
importFromJson().catch(console.error);
