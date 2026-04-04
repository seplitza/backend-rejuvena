"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function makeEnTagVisible() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Подключено к MongoDB\n');
        const enTag = await Tag_model_1.default.findOne({ slug: 'en' });
        if (!enTag) {
            console.log('❌ Тег EN не найден');
            return;
        }
        console.log(`📌 Текущее состояние тега EN:`);
        console.log(`   Название: ${enTag.name}`);
        console.log(`   Цвет: ${enTag.color}`);
        console.log(`   Видимый: ${enTag.isVisible}\n`);
        if (enTag.isVisible) {
            console.log('✅ Тег уже видимый!');
        }
        else {
            enTag.isVisible = true;
            await enTag.save();
            console.log('✅ Тег EN теперь ВИДИМЫЙ в админке!\n');
        }
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Отключено от MongoDB');
    }
}
makeEnTagVisible();
