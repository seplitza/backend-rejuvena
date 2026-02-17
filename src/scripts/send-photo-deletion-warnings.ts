import mongoose from 'mongoose';
import PhotoDiary from '../models/PhotoDiary.model';
import User from '../models/User.model';
import emailService from '../services/email.service';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Отправка email-уведомлений о предстоящем удалении фото
 * Уведомления за 7, 3 и 1 день до истечения срока
 * Запускается через PM2 cron (ежедневно в 10:00)
 */
async function sendDeletionWarnings() {
  try {
    console.log('📧 Starting photo deletion warning notifications...');

    // Подключаемся к MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    
    // Рассчитываем пороговые даты
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // 7-дневные уведомления
    await sendWarningsForThreshold(sevenDaysLater, 'sevenDays', 7);
    
    // 3-дневные уведомления
    await sendWarningsForThreshold(threeDaysLater, 'threeDays', 3);
    
    // 1-дневные уведомления
    await sendWarningsForThreshold(oneDayLater, 'oneDay', 1);

    console.log('✅ Notification sending completed\n');

  } catch (error) {
    console.error('❌ Notification script error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

/**
 * Отправка уведомлений для конкретного порога (7/3/1 день)
 */
async function sendWarningsForThreshold(
  thresholdDate: Date,
  notificationField: 'sevenDays' | 'threeDays' | 'oneDay',
  daysRemaining: number
) {
  try {
    console.log(`\n🔔 Processing ${daysRemaining}-day warnings...`);

    // Находим фото, которые истекают примерно в этот день
    const photos = await PhotoDiary.find({
      expiryDate: {
        $gte: new Date(thresholdDate.getTime() - 12 * 60 * 60 * 1000), // -12 часов
        $lte: new Date(thresholdDate.getTime() + 12 * 60 * 60 * 1000)  // +12 часов
      },
      [`notificationsSent.${notificationField}`]: false,
      storageType: 'cropped' // Только финальные фото
    });

    console.log(`📊 Found ${photos.length} photos expiring in ${daysRemaining} days`);

    // Группируем по пользователям
    const userPhotos = new Map<string, typeof photos>();
    for (const photo of photos) {
      const userId = photo.userId.toString();
      if (!userPhotos.has(userId)) {
        userPhotos.set(userId, []);
      }
      userPhotos.get(userId)!.push(photo);
    }

    let emailsSent = 0;
    let errors = 0;

    // Отправляем по одному письму на пользователя
    for (const [userId, userPhotosList] of userPhotos) {
      try {
        const user = await User.findById(userId);
        if (!user || !user.email) {
          console.log(`  ⚠️  User ${userId} not found or has no email`);
          continue;
        }

        // Считаем количество фото
        const photoCount = userPhotosList.length;

        // Формируем текст письма
        const subject = `⏰ Фото из дневника будут удалены через ${daysRemaining} ${getDaysWord(daysRemaining)}`;
        const message = generateEmailBody(user.firstName || user.email, photoCount, daysRemaining, user.isPremium || false);

        // Отправляем email
        await emailService.sendEmail({
          to: user.email,
          subject,
          html: message
        });

        emailsSent++;
        console.log(`  ✅ Email sent to ${user.email} (${photoCount} photos)`);

        // Помечаем уведомления как отправленные
        for (const photo of userPhotosList) {
          photo.notificationsSent[notificationField] = true;
          await photo.save();
        }

      } catch (error) {
        errors++;
        console.error(`  ❌ Error sending email to user ${userId}:`, error);
      }
    }

    console.log(`📈 ${daysRemaining}-day summary: ${emailsSent} emails sent, ${errors} errors`);

  } catch (error) {
    console.error(`Error processing ${daysRemaining}-day threshold:`, error);
  }
}

/**
 * Генерация HTML тела письма
 */
function generateEmailBody(userName: string, photoCount: number, daysRemaining: number, isPremium: boolean): string {
  const photosWord = photoCount === 1 ? 'фотография' : photoCount < 5 ? 'фотографии' : 'фотографий';
  const willBeWord = photoCount === 1 ? 'будет удалена' : 'будут удалены';
  
  let premiumSection = '';
  if (!isPremium) {
    premiumSection = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-top: 20px; color: white;">
        <h3 style="margin: 0 0 10px 0;">💎 Продлите хранение фото навсегда</h3>
        <p style="margin: 0 0 15px 0;">Оформите премиум-доступ и ваши фото будут храниться на время обучения + 1 месяц после.</p>
        <a href="${process.env.FRONTEND_URL || 'https://seplitza.github.io/rejuvena'}/marathons" 
           style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Выбрать марафон
        </a>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Здравствуйте, ${userName}!</h2>
        
        <p>Напоминаем, что через <strong>${daysRemaining} ${getDaysWord(daysRemaining)}</strong> из вашего фотодневника ${willBeWord} <strong>${photoCount} ${photosWord}</strong>.</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>⚠️ Дата удаления:</strong> ${new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}</p>
        </div>
        
        <p>Если вы хотите сохранить эти фото, пожалуйста:</p>
        <ul>
          <li>Скачайте их из своего фотодневника</li>
          <li>Или продлите хранение, оформив премиум-доступ</li>
        </ul>

        ${premiumSection}
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6c757d; margin-bottom: 0;">
          С уважением,<br>
          Команда <strong>Rejuvena</strong>
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Склонение слова "день"
 */
function getDaysWord(days: number): string {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}

// Запускаем скрипт
sendDeletionWarnings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
