"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FortuneWheelPrize_model_1 = __importDefault(require("../models/FortuneWheelPrize.model"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function updateProbabilities() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Получаем все призы
        const prizes = await FortuneWheelPrize_model_1.default.find({}).sort({ displayOrder: 1 });
        console.log('\n📊 Текущие вероятности:');
        let totalProb = 0;
        prizes.forEach(p => {
            console.log(`[${p.displayOrder || 'N/A'}] ${p.name} - ${p.probability}% (${p.type})`);
            totalProb += p.probability;
        });
        console.log(`\nСумма: ${totalProb}%\n`);
        // Обновляем вероятности товарных призов
        const updates = [
            { name: 'Набор: сыворотка + крем', newProb: 5 },
            { name: 'Крем на выбор', newProb: 2 },
            { name: 'БАД на выбор', newProb: 2 }
        ];
        let savedPercent = 0;
        for (const update of updates) {
            const prize = await FortuneWheelPrize_model_1.default.findOne({ name: update.name });
            if (prize) {
                const oldProb = prize.probability;
                savedPercent += (oldProb - update.newProb);
                prize.probability = update.newProb;
                await prize.save();
                console.log(`✅ ${update.name}: ${oldProb}% → ${update.newProb}% (освобождено ${oldProb - update.newProb}%)`);
            }
            else {
                console.log(`⚠️ Приз "${update.name}" не найден`);
            }
        }
        console.log(`\n💾 Всего освобождено: ${savedPercent}%`);
        // Перераспределяем на скидки и бесплатную доставку
        const discountPrizes = await FortuneWheelPrize_model_1.default.find({ type: 'discount' });
        const shippingPrizes = await FortuneWheelPrize_model_1.default.find({ type: 'freeShipping' });
        const toRedistribute = discountPrizes.concat(shippingPrizes);
        const perPrize = savedPercent / toRedistribute.length;
        console.log(`\n📦 Перераспределяем по ${perPrize.toFixed(2)}% на каждый приз (скидки + доставка):`);
        for (const prize of toRedistribute) {
            const oldProb = prize.probability;
            prize.probability += perPrize;
            await prize.save();
            console.log(`  ${prize.name}: ${oldProb}% → ${prize.probability.toFixed(2)}%`);
        }
        // Проверяем итоговую сумму
        console.log('\n📊 Финальные вероятности:');
        const updatedPrizes = await FortuneWheelPrize_model_1.default.find({}).sort({ displayOrder: 1 });
        let newTotal = 0;
        updatedPrizes.forEach(p => {
            console.log(`[${p.displayOrder || 'N/A'}] ${p.name} - ${p.probability.toFixed(2)}% (${p.type})`);
            newTotal += p.probability;
        });
        console.log(`\nСумма: ${newTotal.toFixed(2)}%`);
        await mongoose_1.default.disconnect();
        console.log('\n✅ Обновление завершено!');
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
updateProbabilities();
