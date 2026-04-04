"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
async function addPricingTags() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('Connected to MongoDB');
        // Создаём теги
        const tags = [
            { name: 'Бесплатное', slug: 'free', color: '#10B981' },
            { name: 'Платное базовое', slug: 'paid-basic', color: '#F59E0B' },
            { name: 'Платное продвинутое', slug: 'paid-advanced', color: '#EF4444' },
            { name: 'На осанку', slug: 'posture', color: '#8B5CF6' }
        ];
        for (const tagData of tags) {
            await Tag_model_1.default.findOneAndUpdate({ slug: tagData.slug }, tagData, { upsert: true, new: true });
            console.log(`✅ Tag "${tagData.name}" created/updated`);
        }
        const freeTag = await Tag_model_1.default.findOne({ slug: 'free' });
        const paidBasicTag = await Tag_model_1.default.findOne({ slug: 'paid-basic' });
        const postureTag = await Tag_model_1.default.findOne({ slug: 'posture' });
        // Упражнения на осанку - бесплатные (5 штук)
        const freePostureExercises = [
            'Лифтинг висков PRO',
            'Лифтинг скуловой области',
            'Перетирания висков', // вместо "Перетягивание F2"
            'Коррекция носослезной борозды',
            'Лифтинг щек. Разминания' // вместо "Лифтинг щек. Перетягивание"
        ];
        // Упражнения на осанку - платные базовые (4 штуки)
        const paidPostureExercises = [
            'Верхнее веко PRO', // вместо "Лифтинг век"
            'Массаж подбородка и челюсти', // вместо "Профилактика второго подбородка"
            'Базовая растяжка шеи', // вместо "Лифтинг шеи"
            'На валике'
        ];
        // Обновляем бесплатные
        for (const title of freePostureExercises) {
            const result = await Exercise_model_1.default.updateOne({ title }, {
                $addToSet: { tags: { $each: [freeTag._id, postureTag._id] } },
                $set: { category: 'На осанку', price: 0, isPremium: false }
            });
            console.log(`📝 Free posture: ${title} (${result.modifiedCount} modified)`);
        }
        // Обновляем платные
        for (const title of paidPostureExercises) {
            const result = await Exercise_model_1.default.updateOne({ title }, {
                $addToSet: { tags: { $each: [paidBasicTag._id, postureTag._id] } },
                $set: { category: 'На осанку', price: 100, isPremium: true }
            });
            console.log(`💰 Paid posture: ${title} (${result.modifiedCount} modified)`);
        }
        // Остальные - бесплатные
        await Exercise_model_1.default.updateMany({ category: { $ne: 'На осанку' } }, {
            $addToSet: { tags: freeTag._id },
            $set: { price: 0, isPremium: false, category: 'Общие' }
        });
        console.log('✅ Updated other exercises as free');
        const stats = await Exercise_model_1.default.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    free: { $sum: { $cond: [{ $eq: ['$price', 0] }, 1, 0] } },
                    paid: { $sum: { $cond: [{ $gt: ['$price', 0] }, 1, 0] } }
                }
            }
        ]);
        console.log('\n📊 Statistics:');
        stats.forEach(stat => {
            console.log(`${stat._id}: ${stat.count} total (${stat.free} free, ${stat.paid} paid)`);
        });
        await mongoose_1.default.disconnect();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
addPricingTags();
