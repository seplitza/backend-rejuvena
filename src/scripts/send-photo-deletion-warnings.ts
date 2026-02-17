import mongoose from 'mongoose';
import User from '../models/User.model';
import EmailTemplate from '../models/EmailTemplate.model';
import EmailLog from '../models/EmailLog.model';
import emailService from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Отправка уведомлений о предстоящей деактивации фотодневника
 * Проверяет user.photoDiaryEndDate и отправляет уведомления за 7/3/1 день
 */

interface NotificationThreshold {
  days: number;
  templateSlug: string;
}

const thresholds: NotificationThreshold[] = [
  { days: 7, templateSlug: 'photo-diary-expiry-7days' },
  { days: 3, templateSlug: 'photo-diary-expiry-3days' },
  { days: 1, templateSlug: 'photo-diary-expiry-1day' }
];

async function sendPhotoDiaryWarnings() {
  try {
    console.log('📧 Starting photo diary warning notifications...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
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
      const users = await User.find({
        photoDiaryEndDate: {
          $gte: startDate,
          $lte: endDate
        },
        firstPhotoDiaryUpload: { $exists: true }, // Только те, кто загружал фото
        contactsEnabled: { $ne: false } // Разрешены рассылки
      });

      console.log(`📊 Found ${users.length} users with photo diary expiring in ${threshold.days} days\n`);

      const template = await EmailTemplate.findOne({ slug: threshold.templateSlug });
      if (!template) {
        console.error(`❌ Template "${threshold.templateSlug}" not found. Run: npm run seed-photo-diary-templates`);
        continue;
      }

      let sent = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Проверяем, не отправляли ли уже это уведомление
          const alreadySent = await EmailLog.findOne({
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
          const success = await emailService.sendEmail({
            to: user.email,
            subject: template.subject || `Уведомление о фотодневнике`,
            html: htmlContent
          });

          if (success) {
            // Логируем отправку
            await EmailLog.create({
              userId: user._id,
              templateId: template._id,
              campaignId: null, // Ручная отправка, не кампания
              status: 'sent',
              sentAt: new Date()
            });

            sent++;
            console.log(`  ✅ Sent to ${user.email}`);
          } else {
            errors++;
            console.error(`  ❌ Failed to send to ${user.email}`);
          }

        } catch (error) {
          errors++;
          console.error(`  ❌ Error sending to ${user.email}:`, error);
        }
      }

      console.log(`📈 ${threshold.days}-day summary: ${sent} emails sent, ${errors} errors\n`);
    }

    console.log('✅ Notification sending completed\n');

  } catch (error) {
    console.error('❌ Error in photo diary warnings:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

sendPhotoDiaryWarnings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
