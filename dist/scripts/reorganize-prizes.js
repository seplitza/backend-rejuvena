"use strict";
/**
 * Script to add 16th prize and reorganize display order
 * Run: ts-node src/scripts/reorganize-prizes.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const FortuneWheelPrize_model_1 = __importDefault(require("../models/FortuneWheelPrize.model"));
dotenv_1.default.config();
async function reorganizePrizes() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        // Get all active prizes
        const prizes = await FortuneWheelPrize_model_1.default.find({ isActive: true }).sort({ _id: 1 });
        console.log(`\n📊 Current prizes: ${prizes.length}`);
        // Check if we already have 16 prizes
        if (prizes.length >= 16) {
            console.log('✅ Already have 16+ prizes, skipping creation');
        }
        else {
            // Create new prize "+1 вращение"
            const newPrize = new FortuneWheelPrize_model_1.default({
                name: '+1 вращение колеса',
                description: 'Получите дополнительное вращение колеса фортуны!',
                type: 'extraSpin',
                value: 1,
                probability: 10,
                icon: '/images/prize-spin-1.png',
                validityDays: 1,
                isActive: true
            });
            await newPrize.save();
            console.log('✅ Added new prize:', newPrize.name);
        }
        // Reload all prizes
        const allPrizes = await FortuneWheelPrize_model_1.default.find({ isActive: true }).sort({ _id: 1 });
        console.log(`\n📦 Total prizes after add: ${allPrizes.length}`);
        // Separate extraSpin and other prizes
        const extraSpinPrizes = allPrizes.filter(p => p.type === 'extraSpin');
        const otherPrizes = allPrizes.filter(p => p.type !== 'extraSpin');
        console.log(`⭐ ExtraSpin prizes: ${extraSpinPrizes.length}`);
        console.log(`📦 Other prizes: ${otherPrizes.length}`);
        // Create new order with evenly distributed spins
        // Positions for extraSpin: 0, 4, 8, 12 (every 4th)
        const orderedPrizes = [];
        let extraIdx = 0;
        let otherIdx = 0;
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0 && extraIdx < extraSpinPrizes.length) {
                // Positions 0, 4, 8, 12 - spins
                orderedPrizes.push(extraSpinPrizes[extraIdx]);
                extraIdx++;
            }
            else if (otherIdx < otherPrizes.length) {
                orderedPrizes.push(otherPrizes[otherIdx]);
                otherIdx++;
            }
        }
        console.log('\n🔄 Setting displayOrder for all prizes...');
        // Set displayOrder for each prize
        for (let idx = 0; idx < orderedPrizes.length; idx++) {
            const prize = orderedPrizes[idx];
            await FortuneWheelPrize_model_1.default.updateOne({ _id: prize._id }, { $set: { displayOrder: idx } });
        }
        console.log('✅ Updated displayOrder for all prizes');
        // Show final order
        const finalPrizes = await FortuneWheelPrize_model_1.default.find({ isActive: true }).sort({ displayOrder: 1 });
        console.log('\n📋 Final prize order:');
        finalPrizes.forEach((p, idx) => {
            const marker = p.type === 'extraSpin' ? '⭐' : '  ';
            console.log(`${marker} [${idx}] ${p.name} (order=${p.displayOrder})`);
        });
        console.log('\n✅ Done! Now 16 prizes with extraSpins evenly distributed at positions 0, 4, 8, 12');
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
reorganizePrizes();
