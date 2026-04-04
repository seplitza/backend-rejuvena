"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_model_1 = __importDefault(require("../models/User.model"));
const EmailTemplate_model_1 = __importDefault(require("../models/EmailTemplate.model"));
const EmailLog_model_1 = __importDefault(require("../models/EmailLog.model"));
const email_service_1 = __importDefault(require("../services/email.service"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const thresholds = [
    { days: 7, templateSlug: 'photo-diary-expiry-7days' },
    { days: 3, templateSlug: 'photo-diary-expiry-3days' },
    { days: 1, templateSlug: 'photo-diary-expiry-1day' }
];
async function sendPhotoDiaryWarnings() {
    try {
        console.log('📧 Starting photo diary warning notifications...\n');
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        const baseUrl = process.env.FRONTEND_URL || 'https://seplitza.github.io/rejuvena';
        for (const threshold of thresholds) {
            console.log(`🔔 Processing ${threshold.days}-day warnings...`);
            const now = new Date();
            const targetDate = new Date(now.getTime() + threshold.days * 24 * 60 * 60 * 1000);
            // Диапазон: ±12 часов от целевой даты
            const startDate = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000);
            const endDate = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000);
            // Находим пользователей, у которых фотодневник истекает примерно через N дней
            const users = await User_model_1.default.find({
                photoDiaryEndDate: {
                    $gte: startDate,
                    $lte: endDate
                },
                firstPhotoDiaryUpload: { $exists: true }, // Только те, кто загружал фото
                contactsEnabled: { $ne: false } // Разрешены рассылки
            });
            console.log(`📊 Found ${users.length} users with photo diary expiring in ${threshold.days} days\n`);
            const template = await EmailTemplate_model_1.default.findOne({ slug: threshold.templateSlug });
            if (!template) {
                console.error(`❌ Template "${threshold.templateSlug}" not found. Run: npm run seed-photo-diary-templates`);
                continue;
            }
            let sent = 0;
            let errors = 0;
            for (const user of users) {
                try {
                    // Проверяем, не отправляли ли уже это уведомление
                    const alreadySent = await EmailLog_model_1.default.findOne({
                        userId: user._id,
                        templateId: template._id,
                        createdAt: {
                            $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // В последние 24 часа
                        }
                    });
                    if (alreadySent) {
                        console.log(`  ⏭️  Skipping ${user.email} - notification already sent`);
                        continue;
                    }
                    // Форматируем дату
                    const expiryDateFormatted = user.photoDiaryEndDate
                        ? user.photoDiaryEndDate.toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                        : 'неизвестно';
                    // Заменяем переменные в шаблоне
                    let htmlContent = template.htmlTemplate || '';
                    htmlContent = htmlContent.replace(/\{\{firstName\}\}/g, user.firstName || user.email.split('@')[0]);
                    htmlContent = htmlContent.replace(/\{\{photoDiaryEndDate\}\}/g, expiryDateFormatted);
                    htmlContent = htmlContent.replace(/\{\{baseUrl\}\}/g, baseUrl);
                    // Отправляем email
                    const success = await email_service_1.default.sendEmail({
                        to: user.email,
                        subject: template.subject || `Уведомление о фотодневнике`,
                        html: htmlContent
                    });
                    if (success) {
                        // Логируем отправку
                        await EmailLog_model_1.default.create({
                            userId: user._id,
                            templateId: template._id,
                            campaignId: null, // Ручная отправка, не кампания
                            status: 'sent',
                            sentAt: new Date()
                        });
                        sent++;
                        console.log(`  ✅ Sent to ${user.email}`);
                    }
                    else {
                        errors++;
                        console.error(`  ❌ Failed to send to ${user.email}`);
                    }
                }
                catch (error) {
                    errors++;
                    console.error(`  ❌ Error sending to ${user.email}:`, error);
                }
            }
            console.log(`📈 ${threshold.days}-day summary: ${sent} emails sent, ${errors} errors\n`);
        }
        console.log('✅ Notification sending completed\n');
    }
    catch (error) {
        console.error('❌ Error in photo diary warnings:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}
sendPhotoDiaryWarnings()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
