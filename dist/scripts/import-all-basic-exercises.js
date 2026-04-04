"use strict";
/**
 * Import REMAINING BASIC exercises from "+Advanced for the Neck" Day 1 JSON
 *
 * ALREADY IMPORTED (skip):
 * - "Advanced for the Neck" (8 exercises)
 * - "Lymphatic drainage" (3 exercises)
 *
 * TO IMPORT:
 * - Posture (9 exercises)
 * - Basic massages (16 exercises)
 * - Sculpting massage (3 exercises)
 * - Vacuum massage (3 exercises)
 * - Better in the evening (1 exercise)
 *
 * TOTAL TO IMPORT: 32 exercises
 *
 * USAGE:
 * 1. Save full JSON response from OLD APP to: src/scripts/data/course-full-data.json
 * 2. Run: npx ts-node src/scripts/import-all-basic-exercises.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const en_tag_1 = require("./utils/en-tag");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
// Categories to SKIP (already imported)
const SKIP_CATEGORIES = [
    'Advanced for the Neck',
    'Lymphatic drainage'
];
// Image/video conversion helper
function convertMediaUrl(url) {
    if (url.includes('player.vimeo.com')) {
        return { type: 'video', url };
    }
    return { type: 'image', url };
}
async function importBasicExercises() {
    try {
        // Connect to MongoDB
        console.log('🔌 Подключаемся к MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        // Get EN tag
        const enTag = await (0, en_tag_1.getEnTag)();
        console.log(`\n📌 Тег EN найден/создан: ${enTag._id}`);
        // Read JSON file
        const jsonPath = path.join(__dirname, 'data', 'course-full-data.json');
        if (!fs.existsSync(jsonPath)) {
            console.error(`\n❌ ОШИБКА: Файл ${jsonPath} не найден!`);
            console.log('\nИнструкции:');
            console.log('1. Откройте браузер Chrome в режиме инкогнито');
            console.log('2. Войдите в OLD APP админку');
            console.log('3. Откройте DevTools (F12) → Network');
            console.log('4. Найдите курс "+Advanced for the Neck"');
            console.log('5. Откройте первый день (Day 1)');
            console.log('6. В Network найдите запрос GET /api/marathon/{marathonId}/day/{dayId}');
            console.log('7. Скопируйте полный JSON ответ');
            console.log(`8. Сохраните в: ${jsonPath}`);
            process.exit(1);
        }
        const courseData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`\n📄 JSON загружен из ${jsonPath}`);
        // Filter only categories we need to import
        const categoriesToImport = courseData.marathonDay.dayCategories.filter((cat) => !SKIP_CATEGORIES.includes(cat.categoryName));
        console.log(`\n📚 Категории для импорта (${categoriesToImport.length}):`);
        categoriesToImport.forEach((cat) => {
            console.log(`  - ${cat.categoryName} (${cat.exercises.length} упражнений)`);
        });
        let totalImported = 0;
        let totalSkipped = 0;
        // Import exercises from each category
        for (const category of categoriesToImport) {
            console.log(`\n\n🏷️  КАТЕГОРИЯ: ${category.categoryName}`);
            console.log(`══════════════════════════════════════`);
            for (const ex of category.exercises) {
                // Check if exercise already exists by name
                const existing = await Exercise_model_1.default.findOne({ title: ex.exerciseName });
                if (existing) {
                    console.log(`  ⏩ ПРОПУСК: "${ex.exerciseName}" - уже существует`);
                    totalSkipped++;
                    continue;
                }
                // Convert exercise contents to media array
                const media = ex.exerciseContents
                    .sort((a, b) => a.order - b.order)
                    .map((content) => {
                    const { type, url } = convertMediaUrl(content.contentPath);
                    return { type, url, order: content.order };
                });
                // Create new exercise
                const newExercise = new Exercise_model_1.default({
                    title: ex.exerciseName,
                    description: ex.exerciseDescription,
                    media,
                    tags: [enTag._id],
                    isActive: true,
                    order: ex.order
                });
                await newExercise.save();
                console.log(`  ✅ ИМПОРТ: "${ex.exerciseName}" (${media.length} медиа)`);
                totalImported++;
            }
        }
        console.log(`\n\n╔════════════════════════════════════════╗`);
        console.log(`║         ИМПОРТ ЗАВЕРШЕН ✅             ║`);
        console.log(`╚════════════════════════════════════════╝`);
        console.log(`\n📊 Статистика:`);
        console.log(`  ✅ Импортировано: ${totalImported} упражнений`);
        console.log(`  ⏩ Пропущено: ${totalSkipped} (уже существуют)`);
        console.log(`  📝 Тег EN добавлен ко всем новым упражнениям`);
    }
    catch (error) {
        console.error('\n❌ ОШИБКА:', error);
        throw error;
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}
// Run import
importBasicExercises()
    .then(() => {
    console.log('\n🎉 Скрипт завершен успешно!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Скрипт завершен с ошибкой:', error.message);
    process.exit(1);
});
