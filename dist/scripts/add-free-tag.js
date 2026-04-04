"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
async function addFreeTag() {
    try {
        await mongoose_1.default.connect('mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB\n');
        // Create or get "На здоровье" tag
        let freeTag = await Tag_model_1.default.findOne({ name: 'На здоровье' });
        if (!freeTag) {
            freeTag = await Tag_model_1.default.create({
                name: 'На здоровье',
                slug: 'na-zdorovie',
                color: '#10b981', // green color for free
            });
            console.log('✅ Создан тег "На здоровье"');
        }
        else {
            console.log('ℹ️  Тег "На здоровье" уже существует');
        }
        // Get first 6 exercises (oldest by creation date)
        const allExercises = await Exercise_model_1.default.find().populate('tags').sort({ createdAt: 1 });
        console.log(`\nВсего упражнений в базе: ${allExercises.length}`);
        // Определяем бесплатные упражнения - первые 6 базовых
        const baseExercises = allExercises.filter((ex) => ex.tags.some((t) => t.name === 'Базовое'));
        const freeExercises = baseExercises.slice(0, 6);
        console.log(`\nБудут помечены как бесплатные (первые 6 базовых):`);
        freeExercises.forEach((ex, i) => {
            console.log(`  ${i + 1}. ${ex.title}`);
        });
        // Add "На здоровье" tag to first 6 exercises
        let updated = 0;
        for (const exercise of freeExercises) {
            const hasFreeTag = exercise.tags.some((t) => t.name === 'На здоровье');
            if (!hasFreeTag) {
                await Exercise_model_1.default.findByIdAndUpdate(exercise._id, { $addToSet: { tags: freeTag._id } });
                updated++;
            }
        }
        console.log(`\n✅ Обновлено ${updated} упражнений`);
        // Show final stats
        const updatedExercises = await Exercise_model_1.default.find().populate('tags');
        const withFreeTag = updatedExercises.filter((ex) => ex.tags.some((t) => t.name === 'На здоровье'));
        const withBasicTag = updatedExercises.filter((ex) => ex.tags.some((t) => t.name === 'Базовое'));
        const withProTag = updatedExercises.filter((ex) => ex.tags.some((t) => t.name === 'продвинутое' || t.name === 'PRO'));
        console.log('\n📊 Итоговая статистика:');
        console.log(`  • БЕСПЛАТНЫЕ (с тегом "На здоровье"): ${withFreeTag.length}`);
        console.log(`  • БАЗОВЫЕ (100₽): ${withBasicTag.length - withFreeTag.length}`);
        console.log(`  • ПРОДВИНУТЫЕ/PRO (200₽): ${withProTag.length}`);
        await mongoose_1.default.disconnect();
        console.log('\n✅ Готово!');
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
addFreeTag();
