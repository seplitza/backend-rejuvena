"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuTag = getRuTag;
const Tag_model_1 = __importDefault(require("../../models/Tag.model"));
/**
 * Получает или создает тег RU (скрытый тег для русских упражнений)
 */
async function getRuTag() {
    let ruTag = await Tag_model_1.default.findOne({ name: 'RU' });
    if (!ruTag) {
        ruTag = await Tag_model_1.default.create({
            name: 'RU',
            slug: 'ru',
            color: '#3B82F6',
            isVisible: false
        });
        console.log('✅ Создан скрытый тег RU');
    }
    else if (ruTag.isVisible !== false) {
        ruTag.isVisible = false;
        await ruTag.save();
        console.log('✅ Тег RU настроен как скрытый');
    }
    return ruTag;
}
