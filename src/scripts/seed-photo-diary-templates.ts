/**
 * Seed Photo Diary Email Templates
 * Создает шаблоны для уведомлений об истечении срока хранения фотодневника
 */

import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate.model';
import dotenv from 'dotenv';

dotenv.config();

const templates = [
  {
    type: 'photo_diary_7days',
    name: 'Фотодневник: осталось 7 дней',
    slug: 'photo-diary-expiry-7days',
    subject: '⏰ Фотодневник будет деактивирован через 7 дней',
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Привет, {{firstName}}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #666;">
          Это напоминание о том, что срок хранения ваших фотографий в Фотодневнике истекает через <strong>7 дней</strong>.
        </p>
        
        <div style="background: #f9f9f9; border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333;">
            <strong>📅 Дата деактивации:</strong> {{photoDiaryEndDate}}
          </p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Как продлить хранение фото на 30 дней:</h3>
        
        <ul style="font-size: 14px; line-height: 1.8; color: #666;">
          <li>✨ Приобрести Premium доступ</li>
          <li>🏃 Купить любое упражнение</li>
          <li>🎯 Записаться на марафон</li>
          <li>📚 Добавить дополнительный месяц практики</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{baseUrl}}/profile/settings" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; 
                    font-weight: bold; font-size: 16px;">
            Продлить хранение фото
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 40px;">
          Если у вас уже есть активная подписка, пожалуйста, проигнорируйте это письмо.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          С любовью, команда Rejuvena ❤️
        </p>
      </div>
    `,
    variables: ['firstName', 'photoDiaryEndDate', 'baseUrl'],
    category: 'photo_diary'
  },
  {
    type: 'photo_diary_3days',
    name: 'Фотодневник: осталось 3 дня',
    slug: 'photo-diary-expiry-3days',
    subject: '⚠️ Фотодневник будет деактивирован через 3 дня!',
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">{{firstName}}, срочное напоминание!</h2>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; color: #856404;">
            ⚠️ Ваши фотографии в Фотодневнике будут удалены через <strong style="color: #d32f2f;">3 дня</strong>!
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #666;">
          До деактивации осталось совсем немного времени. Не потеряйте результаты своих тренировок!
        </p>
        
        <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; color: #333;">
            <strong>📅 Дата деактивации:</strong> {{photoDiaryEndDate}}<br>
            <strong>⏰ Осталось:</strong> 3 дня
          </p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Продлить хранение очень просто!</h3>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">
            🎁 Любая покупка автоматически продлевает хранение фото на <strong>30 дней</strong>:
          </p>
          <ul style="font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Premium доступ</li>
            <li>Упражнения</li>
            <li>Марафоны</li>
            <li>Дополнительные месяцы практики</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{baseUrl}}/profile/settings" 
             style="display: inline-block; background: #d32f2f; color: white; padding: 18px 50px; 
                    text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; 
                    box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);">
            Продлить сейчас
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 40px; text-align: center;">
          Не упустите свой прогресс! Сохраните результаты тренировок.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          С уважением, команда Rejuvena
        </p>
      </div>
    `,
    variables: ['firstName', 'photoDiaryEndDate', 'baseUrl'],
    category: 'photo_diary'
  },
  {
    type: 'photo_diary_1day',
    name: 'Фотодневник: последний день!',
    slug: 'photo-diary-expiry-1day',
    subject: '🔴 СРОЧНО: Фотодневник будет деактивирован завтра!',
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #d32f2f; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; font-size: 24px;">🔴 ПОСЛЕДНИЙ ДЕНЬ!</h2>
        </div>
        
        <div style="background: white; padding: 30px; border: 2px solid #d32f2f; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; font-weight: bold; color: #333; margin-top: 0;">
            Привет, {{firstName}}!
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #666;">
            Это последнее напоминание — ваши фотографии в Фотодневнике будут удалены <strong style="color: #d32f2f;">ЗАВТРА</strong>.
          </p>
          
          <div style="background: #ffebee; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #d32f2f;">
            <p style="margin: 0; font-size: 18px; color: #c62828;">
              ⏰ <strong>Деактивация:</strong> {{photoDiaryEndDate}}<br>
              📸 <strong>Осталось:</strong> Менее 24 часов!
            </p>
          </div>
          
          <h3 style="color: #333; font-size: 20px; margin: 30px 0 15px 0;">
            Не потеряйте результаты своих тренировок!
          </h3>
          
          <p style="font-size: 15px; color: #666; line-height: 1.6;">
            Продлите хранение фото прямо сейчас — это займет всего несколько секунд. 
            Любая покупка автоматически продлевает доступ к Фотодневнику на <strong>30 дней</strong>.
          </p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">🎯 Доступные варианты:</p>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">✨ Premium доступ → +30 дней</li>
              <li style="margin: 8px 0;">🏃 Любое упражнение → +30 дней</li>
              <li style="margin: 8px 0;">🎯 Марафон → +30 дней</li>
              <li style="margin: 8px 0;">📚 Месяц практики → +30 дней</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0 25px 0;">
            <a href="{{baseUrl}}/profile/settings" 
               style="display: inline-block; background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); 
                      color: white; padding: 20px 60px; text-decoration: none; border-radius: 30px; 
                      font-weight: bold; font-size: 20px; box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4);
                      transition: all 0.3s;">
              Продлить хранение
            </a>
          </div>
          
          <p style="font-size: 13px; color: #999; text-align: center; margin-top: 30px;">
            Это последнее уведомление. После деактивации восстановить фото будет невозможно.
          </p>
        </div>
        
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
          Команда Rejuvena всегда с вами ❤️
        </p>
      </div>
    `,
    variables: ['firstName', 'photoDiaryEndDate', 'baseUrl'],
    category: 'photo_diary'
  }
];

async function seedPhotoDiaryTemplates() {
  try {
    console.log('🌱 Seeding Photo Diary Email Templates...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    for (const template of templates) {
      const existing = await EmailTemplate.findOne({ slug: template.slug });
      
      if (existing) {
        console.log(`  ⚠️  Template "${template.name}" already exists, updating...`);
        await EmailTemplate.findByIdAndUpdate(existing._id, template);
      } else {
        console.log(`  ✅ Creating template "${template.name}"...`);
        await EmailTemplate.create(template);
      }
    }

    console.log('\n✅ Photo Diary Email Templates seeded successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

seedPhotoDiaryTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
