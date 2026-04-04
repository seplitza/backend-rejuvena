"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
dotenv_1.default.config();
// Функция для очистки HTML от стилей, Froala и спецсимволов
function cleanHTML(html, exerciseTitle) {
    if (!html)
        return '';
    let cleaned = html;
    // Удаляем Froala упоминания
    cleaned = cleaned.replace(/<p data-f-id="pbf"[^>]*>.*?<\/p>/gs, '');
    cleaned = cleaned.replace(/Powered by <a href="https:\/\/www\.froala\.com[^>]*>.*?<\/a>/gi, '');
    cleaned = cleaned.replace(/<a href="https:\/\/www\.froala\.com[^>]*>.*?<\/a>/gi, '');
    // Удаляем инлайн стили с цветом (особенно белый текст)
    cleaned = cleaned.replace(/style="[^"]*color:\s*(?:white|#fff|#ffffff|rgba?\(255,\s*255,\s*255[^)]*\))[^"]*"/gi, '');
    cleaned = cleaned.replace(/style="[^"]*background:\s*url\([^)]*emojione[^)]*\)[^"]*"/gi, '');
    // Удаляем fr-emoticon spans (эмодзи)
    cleaned = cleaned.replace(/<span class="fr-emoticon[^>]*>.*?<\/span>/g, '');
    // Удаляем эмодзи и спецсимволы Unicode
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Эмодзи
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Разные символы
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Дингбаты
    cleaned = cleaned.replace(/&nbsp;/g, ' '); // Неразрывные пробелы
    // Удаляем название упражнения из начала, если оно там есть
    const titlePattern = new RegExp(`^<p>\\s*<strong>\\s*${escapeRegex(exerciseTitle)}\\s*<\\/strong>\\s*<\\/p>`, 'i');
    cleaned = cleaned.replace(titlePattern, '');
    // Очищаем множественные пустые параграфы
    cleaned = cleaned.replace(/(<p>\s*<\/p>\s*){2,}/g, '<p></p>');
    cleaned = cleaned.replace(/^(<p>\s*<\/p>\s*)+/, '');
    // Очищаем пустые spans и лишние пробелы
    cleaned = cleaned.replace(/<span>\s*<\/span>/g, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    return cleaned.trim();
}
// Вспомогательная функция для экранирования спецсимволов в regex
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function cleanExercises() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Подключено к MongoDB\n');
        // Находим все опубликованные упражнения
        const exercises = await Exercise_model_1.default.find({ isPublished: true });
        console.log(`📦 Найдено упражнений: ${exercises.length}\n`);
        let updatedCount = 0;
        for (const exercise of exercises) {
            const originalContent = exercise.content;
            const cleanedContent = cleanHTML(originalContent, exercise.title);
            if (originalContent !== cleanedContent) {
                exercise.content = cleanedContent;
                await exercise.save();
                console.log(`✅ Очищено: ${exercise.title}`);
                console.log(`   Было символов: ${originalContent.length}`);
                console.log(`   Стало символов: ${cleanedContent.length}\n`);
                updatedCount++;
            }
            else {
                console.log(`⏭️  Без изменений: ${exercise.title}\n`);
            }
        }
        console.log('📊 Итого:');
        console.log(`✅ Обновлено: ${updatedCount}`);
        console.log(`⏭️  Без изменений: ${exercises.length - updatedCount}`);
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n👋 Отключено от MongoDB');
    }
}
cleanExercises();
