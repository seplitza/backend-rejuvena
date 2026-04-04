"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function check() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        // Получаем теги
        const lipsJawTag = await Tag_model_1.default.findOne({ name: '+на губы и челюсть' });
        const proTag = await Tag_model_1.default.findOne({ name: 'PRO' });
        const ruTag = await Tag_model_1.default.findOne({ name: 'RU' });
        console.log('Теги:');
        console.log('  +на губы и челюсть:', lipsJawTag?._id.toString(), 'isVisible:', lipsJawTag?.isVisible);
        console.log('  PRO:', proTag?._id.toString(), 'isVisible:', proTag?.isVisible);
        console.log('  RU:', ruTag?._id.toString(), 'isVisible:', ruTag?.isVisible);
        // Проверяем упражнения
        const exercise = await Exercise_model_1.default.findOne({ title: 'Расслабление носогубных складок' }).populate('tags');
        console.log('\nПример упражнения: Расслабление носогубных складок');
        console.log('Теги упражнения:', exercise?.tags.map((t) => t.name).join(', '));
        // Считаем упражнения с тегом "+на губы и челюсть"
        const count = await Exercise_model_1.default.countDocuments({ tags: lipsJawTag?._id });
        console.log(`\nВсего упражнений с тегом "+на губы и челюсть": ${count}`);
        await mongoose_1.default.connection.close();
    }
    catch (error) {
        console.error('Ошибка:', error);
        await mongoose_1.default.connection.close();
    }
}
check();
