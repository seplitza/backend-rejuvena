"use strict";
/**
 * Скрипт для отправки уведомлений о марафонах
 * Запускается как cron job (например, раз в день утром)
 *
 * Использование:
 * npm run send-notifications
 * или через PM2 cron:
 * pm2 start npm --name "marathon-notifier" --cron "0 9 * * *" -- run send-notifications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Marathon_model_1 = __importDefault(require("../models/Marathon.model"));
const MarathonEnrollment_model_1 = __importDefault(require("../models/MarathonEnrollment.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const email_service_1 = __importDefault(require("../services/email.service"));
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function connectDB() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}
/**
 * Отправка напоминаний за день до старта марафона
 */
async function sendStartReminderEmails() {
    console.log('\n🔔 Checking for marathons starting tomorrow...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    try {
        // Находим марафоны, которые стартуют завтра
        const marathons = await Marathon_model_1.default.find({
            startDate: {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            },
            isPublic: true
        });
        if (marathons.length === 0) {
            console.log('No marathons starting tomorrow');
            return;
        }
        console.log(`Found ${marathons.length} marathon(s) starting tomorrow`);
        for (const marathon of marathons) {
            console.log(`\n📧 Sending reminders for: ${marathon.title}`);
            // Находим всех записавшихся пользователей
            const enrollments = await MarathonEnrollment_model_1.default.find({
                marathonId: marathon._id,
                status: { $in: ['pending', 'active'] }
            });
            console.log(`  - ${enrollments.length} enrollments found`);
            for (const enrollment of enrollments) {
                try {
                    const user = await User_model_1.default.findById(enrollment.userId);
                    if (!user?.email)
                        continue;
                    const success = await email_service_1.default.sendMarathonReminderEmail(user.email, marathon.title, marathon.startDate);
                    if (success) {
                        console.log(`  ✅ Sent to ${user.email}`);
                    }
                    else {
                        console.log(`  ❌ Failed to send to ${user.email}`);
                    }
                    // Небольшая задержка между письмами
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`  ❌ Error sending to enrollment ${enrollment._id}:`, error);
                }
            }
        }
    }
    catch (error) {
        console.error('Error in sendStartReminderEmails:', error);
    }
}
/**
 * Отправка уведомлений в день старта марафона
 */
async function sendStartDayEmails() {
    console.log('\n🚀 Checking for marathons starting today...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
        // Находим марафоны, которые стартуют сегодня
        const marathons = await Marathon_model_1.default.find({
            startDate: {
                $gte: today,
                $lt: tomorrow
            },
            isPublic: true
        });
        if (marathons.length === 0) {
            console.log('No marathons starting today');
            return;
        }
        console.log(`Found ${marathons.length} marathon(s) starting today`);
        for (const marathon of marathons) {
            console.log(`\n📧 Sending start emails for: ${marathon.title}`);
            // Находим всех активных участников
            const enrollments = await MarathonEnrollment_model_1.default.find({
                marathonId: marathon._id,
                status: 'active'
            });
            console.log(`  - ${enrollments.length} active enrollments found`);
            for (const enrollment of enrollments) {
                try {
                    const user = await User_model_1.default.findById(enrollment.userId);
                    if (!user?.email)
                        continue;
                    const success = await email_service_1.default.sendMarathonStartEmail(user.email, marathon.title, marathon.numberOfDays);
                    if (success) {
                        console.log(`  ✅ Sent to ${user.email}`);
                    }
                    else {
                        console.log(`  ❌ Failed to send to ${user.email}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`  ❌ Error sending to enrollment ${enrollment._id}:`, error);
                }
            }
        }
    }
    catch (error) {
        console.error('Error in sendStartDayEmails:', error);
    }
}
/**
 * Отправка ежедневных напоминаний для активных марафонов
 */
async function sendDailyReminders() {
    console.log('\n📅 Checking for active marathons needing daily reminders...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
        // Находим марафоны, которые уже начались и еще не закончились
        const marathons = await Marathon_model_1.default.find({
            startDate: { $lte: today },
            isPublic: true
        });
        if (marathons.length === 0) {
            console.log('No active marathons found');
            return;
        }
        let totalSent = 0;
        for (const marathon of marathons) {
            // Проверяем, не закончился ли марафон
            const endDate = new Date(marathon.startDate);
            endDate.setDate(endDate.getDate() + marathon.tenure);
            if (today >= endDate) {
                continue; // Марафон уже закончился
            }
            // Вычисляем текущий день марафона
            const daysSinceStart = Math.floor((today.getTime() - marathon.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const currentDay = daysSinceStart + 1;
            if (currentDay < 1 || currentDay > marathon.numberOfDays) {
                continue;
            }
            console.log(`\n📧 Daily reminder for: ${marathon.title} (Day ${currentDay}/${marathon.numberOfDays})`);
            // Находим активных участников
            const enrollments = await MarathonEnrollment_model_1.default.find({
                marathonId: marathon._id,
                status: 'active'
            });
            console.log(`  - ${enrollments.length} active participants`);
            for (const enrollment of enrollments) {
                try {
                    // Пропускаем, если пользователь уже завершил этот день
                    if (enrollment.completedDays && enrollment.completedDays.includes(currentDay)) {
                        continue;
                    }
                    const user = await User_model_1.default.findById(enrollment.userId);
                    if (!user?.email)
                        continue;
                    const success = await email_service_1.default.sendMarathonDailyReminderEmail(user.email, marathon.title, currentDay, marathon.numberOfDays);
                    if (success) {
                        totalSent++;
                        console.log(`  ✅ Sent to ${user.email}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`  ❌ Error sending reminder:`, error);
                }
            }
        }
        console.log(`\n✅ Total daily reminders sent: ${totalSent}`);
    }
    catch (error) {
        console.error('Error in sendDailyReminders:', error);
    }
}
/**
 * Отправка уведомлений о завершении марафона
 */
async function sendCompletionEmails() {
    console.log('\n🏁 Checking for marathons completed today...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
        // Находим марафоны, которые заканчиваются сегодня
        const marathons = await Marathon_model_1.default.find({
            isPublic: true
        });
        let totalSent = 0;
        for (const marathon of marathons) {
            const endDate = new Date(marathon.startDate);
            endDate.setDate(endDate.getDate() + marathon.tenure);
            // Проверяем, заканчивается ли марафон сегодня
            if (endDate < today || endDate >= tomorrow) {
                continue;
            }
            console.log(`\n📧 Completion emails for: ${marathon.title}`);
            // Находим всех участников
            const enrollments = await MarathonEnrollment_model_1.default.find({
                marathonId: marathon._id,
                status: 'active'
            });
            console.log(`  - ${enrollments.length} participants`);
            for (const enrollment of enrollments) {
                try {
                    const user = await User_model_1.default.findById(enrollment.userId);
                    if (!user?.email)
                        continue;
                    const completedDays = enrollment.completedDays?.length || 0;
                    const success = await email_service_1.default.sendMarathonCompletionEmail(user.email, marathon.title, marathon.numberOfDays, completedDays);
                    if (success) {
                        totalSent++;
                        console.log(`  ✅ Sent to ${user.email} (${completedDays}/${marathon.numberOfDays} days completed)`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    console.error(`  ❌ Error sending completion email:`, error);
                }
            }
        }
        console.log(`\n✅ Total completion emails sent: ${totalSent}`);
    }
    catch (error) {
        console.error('Error in sendCompletionEmails:', error);
    }
}
/**
 * Main function
 */
async function main() {
    console.log('🏃 Marathon Notification Service');
    console.log('================================');
    console.log(`Date: ${new Date().toLocaleString('ru-RU')}`);
    await connectDB();
    try {
        // 1. Напоминания за день до старта
        await sendStartReminderEmails();
        // 2. Уведомления в день старта
        await sendStartDayEmails();
        // 3. Ежедневные напоминания для активных марафонов
        await sendDailyReminders();
        // 4. Уведомления о завершении
        await sendCompletionEmails();
        console.log('\n✅ Notification service completed successfully');
    }
    catch (error) {
        console.error('\n❌ Error in notification service:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}
// Run if executed directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
exports.default = main;
