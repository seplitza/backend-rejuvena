"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnTag = getEnTag;
const Tag_model_1 = __importDefault(require("../../models/Tag.model"));
/**
 * Получает или создает тег EN (скрытый тег для английских упражнений)
 */
async function getEnTag() {
    let enTag = await Tag_model_1.default.findOne({ name: 'EN' });
    if (!enTag) {
        enTag = await Tag_model_1.default.create({
            name: 'EN',
            slug: 'en',
            color: '#10B981',
            isVisible: false
        });
        console.log('✅ Создан скрытый тег EN');
    }
    else if (enTag.isVisible !== false) {
        enTag.isVisible = false;
        await enTag.save();
        console.log('✅ Тег EN настроен как скрытый');
    }
    return enTag;
}
