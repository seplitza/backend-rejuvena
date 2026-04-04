"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function checkTags() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('\n📋 Все теги в базе данных:');
        const allTags = await Tag_model_1.default.find().sort({ name: 1 });
        allTags.forEach(tag => {
            const visibility = tag.isVisible === false ? '🔒 скрытый' : '👁️  видимый';
            console.log(`  - ${tag.name} (slug: ${tag.slug}) ${visibility}`);
        });
        console.log('\n✅ Только видимые теги (как в API):');
        const visibleTags = await Tag_model_1.default.find({
            $or: [
                { isVisible: { $ne: false } },
                { isVisible: { $exists: false } }
            ]
        }).sort({ name: 1 });
        visibleTags.forEach(tag => console.log(`  - ${tag.name}`));
        console.log('\n🔒 Скрытые теги:');
        const hiddenTags = await Tag_model_1.default.find({ isVisible: false }).sort({ name: 1 });
        hiddenTags.forEach(tag => console.log(`  - ${tag.name}`));
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}
checkTags();
