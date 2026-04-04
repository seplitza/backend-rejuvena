"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const ExerciseCategory_model_1 = __importDefault(require("../models/ExerciseCategory.model"));
dotenv_1.default.config();
const defaultCategories = [
    { name: 'Массаж', slug: 'massage', icon: '💆‍♀️', order: 1 },
    { name: 'Лимфодренажное Похлопывание', slug: 'lymphatic-drainage', icon: '👋', order: 2 },
    { name: 'Иллюстрации', slug: 'illustrations', icon: '📸', order: 3 },
    { name: 'Вакуумное глубокое скульптурирование', slug: 'vacuum-sculpting', icon: '🫧', order: 4 },
    { name: 'Скульптурирование с кремом', slug: 'cream-sculpting', icon: '✨', order: 5 },
    { name: 'Дополнительные упражнения', slug: 'additional-exercises', icon: '➕', order: 6 },
    { name: 'Стопы - стержень', slug: 'feet-foundation', icon: '🦶', order: 7 },
    { name: 'Завершающие упражнения', slug: 'final-exercises', icon: '✅', order: 8 },
    { name: 'Упражнения на натяжение', slug: 'tension-exercises', icon: '🎯', order: 9 }
];
async function seedCategories() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Проверяем есть ли уже категории
        const existingCount = await ExerciseCategory_model_1.default.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  В базе уже есть ${existingCount} категорий. Хотите перезаписать? (yes/no)`);
            // В production скрипте можно добавить prompt для подтверждения
            // Пока просто добавим только новые
            for (const category of defaultCategories) {
                const existing = await ExerciseCategory_model_1.default.findOne({ slug: category.slug });
                if (!existing) {
                    await ExerciseCategory_model_1.default.create(category);
                    console.log(`✅ Создана категория: ${category.name}`);
                }
                else {
                    console.log(`⏩ Категория уже существует: ${category.name}`);
                }
            }
        }
        else {
            // Создаём все категории
            await ExerciseCategory_model_1.default.insertMany(defaultCategories);
            console.log(`✅ Создано ${defaultCategories.length} категорий`);
        }
        console.log('\n📋 Все категории:');
        const allCategories = await ExerciseCategory_model_1.default.find().sort({ order: 1 });
        allCategories.forEach(cat => {
            console.log(`  ${cat.icon} ${cat.name} (${cat.slug})`);
        });
        await mongoose_1.default.disconnect();
        console.log('\n✅ Готово!');
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
seedCategories();
