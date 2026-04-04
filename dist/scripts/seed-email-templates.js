"use strict";
/**
 * Seed Email Templates
 * Creates initial email templates with beautiful designs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const EmailTemplate_model_1 = __importDefault(require("../models/EmailTemplate.model"));
const templates = [
    {
        type: 'enrollment',
        name: 'Подтверждение записи на марафон',
        subject: 'Вы записаны на марафон "{marathonTitle}" 🎉',
        description: 'Отправляется сразу после записи на марафон',
        variables: ['marathonTitle', 'startDate', 'numberOfDays', 'telegramUrl'],
        htmlTemplate: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">🎉</h1>
          <h2 style="margin: 15px 0 5px 0; color: white; font-size: 26px; font-weight: 600;">Поздравляем!</h2>
          <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">Вы на пути к преображению</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
            Вы успешно записаны на марафон:
          </p>

          <!-- Marathon Info Card -->
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #667eea;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px; font-weight: 600;">{marathonTitle}</h3>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="font-size: 24px; margin-right: 10px;">📅</span>
              <div>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Дата старта</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; color: #1f2937; font-weight: 600;">{startDate}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="font-size: 24px; margin-right: 10px;">⏱</span>
              <div>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Продолжительность</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; color: #1f2937; font-weight: 600;">{numberOfDays} дней</p>
              </div>
            </div>
          </div>

          <!-- What to expect -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #92400e; font-weight: 600;">💫 Что вас ждёт:</p>
            <ul style="margin: 0; padding-left: 20px; color: #78350f;">
              <li style="margin: 8px 0;">Упражнения откроются в день старта марафона</li>
              <li style="margin: 8px 0;">Новый день — новые практики для омоложения</li>
              <li style="margin: 8px 0;">Поддержка от команды и участников сообщества</li>
              <li style="margin: 8px 0;">Бесплатные прямые эфиры с автором методики</li>
            </ul>
          </div>

          <!-- Telegram CTA -->
          {telegramUrl}

          <!-- Footer Note -->
          <p style="margin: 25px 0 0 0; font-size: 14px; color: #9ca3af; text-align: center;">
            Мы отправим напоминание перед стартом марафона 💌
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">С любовью, команда Омолодись 🌸</p>
        </div>
      </div>
    `
    },
    {
        type: 'pre_start_reminder',
        name: 'Напоминание за день до старта',
        subject: 'Завтра стартует "{marathonTitle}"! Готовы? 🚀',
        description: 'Отправляется за 1 день до начала марафона',
        variables: ['marathonTitle', 'startDate'],
        htmlTemplate: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <!-- Header with countdown -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 48px;">⏰</h1>
          <h2 style="margin: 15px 0 5px 0; color: white; font-size: 28px; font-weight: 700;">Осталось 24 часа!</h2>
          <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 18px;">До начала вашего путешествия к молодости</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 20px; color: #374151; line-height: 1.6; margin: 0 0 25px 0;">
            Завтра начинается ваш марафон:
          </p>

          <!-- Marathon Card -->
          <div style="background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 26px; font-weight: 700;">{marathonTitle}</h3>
            <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Старт</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; color: #dc2626; font-weight: 700;">{startDate}</p>
            </div>
          </div>

          <!-- Preparation tips -->
          <div style="background: #dbeafe; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
            <p style="margin: 0 0 15px 0; font-size: 18px; color: #1e40af; font-weight: 600;">📝 Как подготовиться:</p>
            <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
              <li style="margin: 10px 0; font-size: 15px;">Выделите 15-20 минут в день для упражнений</li>
              <li style="margin: 10px 0; font-size: 15px;">Установите напоминание на телефоне (утро или вечер)</li>
              <li style="margin: 10px 0; font-size: 15px;">Подготовьте удобное место для занятий</li>
              <li style="margin: 10px 0; font-size: 15px;">Приготовьтесь фотографировать прогресс (до/после)</li>
            </ul>
          </div>

          <!-- Motivational quote -->
          <div style="text-align: center; padding: 30px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 20px; color: #6b7280; font-style: italic; line-height: 1.6;">
              "Путь в тысячу миль начинается<br>с первого шага"
            </p>
          </div>

          <p style="margin: 25px 0 0 0; font-size: 16px; color: #374151; text-align: center;">До встречи завтра! 💪</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Мы верим в вас! 🌟</p>
        </div>
      </div>
    `
    },
    {
        type: 'start',
        name: 'Письмо в день старта марафона',
        subject: '🎊 "{marathonTitle}" начался! Открыт День 1',
        description: 'Отправляется в день начала марафона',
        variables: ['marathonTitle', 'numberOfDays', 'marathonUrl'],
        htmlTemplate: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <!-- Celebratory header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; border-radius: 12px 12px 0 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><text y=\".9em\" font-size=\"80\">🎉</text></svg>') repeat; opacity: 0.1;"></div>
          <h1 style="margin: 0; color: white; font-size: 56px; position: relative; z-index: 1;">🎊</h1>
          <h2 style="margin: 20px 0 10px 0; color: white; font-size: 32px; font-weight: 700; position: relative; z-index: 1;">Это день начала!</h2>
          <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 18px; position: relative; z-index: 1;">{marathonTitle}</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 20px; color: #374151; line-height: 1.8; margin: 0 0 25px 0; text-align: center;">
            <strong>Поздравляем с началом марафона!</strong><br>
            Первый день уже ждёт вас 🌟
          </p>

          <!-- Day 1 Card -->
          <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">
            <p style="margin: 0 0 10px 0; font-size: 48px;">1️⃣</p>
            <p style="margin: 0; font-size: 16px; color: #065f46; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">День первый из {numberOfDays}</p>
            <p style="margin: 15px 0 25px 0; font-size: 18px; color: #047857;">Время начать преображение</p>
            <a href="{marathonUrl}" style="display: inline-block; background: white; color: #047857; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 700; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              Начать День 1 →
            </a>
          </div>

          <!-- Tips box -->
          <div style="background: #fef3c7; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; font-size: 18px; color: #92400e; font-weight: 600;">💡 Советы для успеха:</p>
            <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 15px;">
              <li style="margin: 10px 0;">Выполняйте упражнения каждый день в одно и то же время</li>
              <li style="margin: 10px 0;">Не пропускайте дни — регулярность это ключ к результату</li>
              <li style="margin: 10px 0;">Фотографируйте себя каждые 7 дней для отслеживания прогресса</li>
              <li style="margin: 10px 0;">Делитесь успехами в нашем сообществе</li>
            </ul>
          </div>

          <!-- Important note -->
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #374151;">
              <strong>Каждый новый день открывается автоматически</strong>
            </p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Мы будем присылать вам напоминания ⏰
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Удачи на марафоне! Мы с вами 💜</p>
        </div>
      </div>
    `
    },
    {
        type: 'daily_reminder',
        name: 'Ежедневное напоминание',
        subject: '☀️ День {dayNumber}/{totalDays}: {marathonTitle}',
        description: 'Отправляется каждое утро во время марафона',
        variables: ['marathonTitle', 'dayNumber', 'totalDays', 'progressPercent', 'marathonUrl'],
        htmlTemplate: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <!-- Morning header -->
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 48px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">☀️</h1>
          <h2 style="margin: 15px 0 5px 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Доброе утро!</h2>
          <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 16px;">Новый день = новые возможности</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #374151; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
            Готовы продолжить путь к молодости?
          </p>

          <!-- Progress card -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 14px;">{marathonTitle}</p>
            <p style="margin: 0 0 20px 0; color: white; font-size: 32px; font-weight: 700;">
              День {dayNumber} из {totalDays}
            </p>
            
            <!-- Progress bar -->
            <div style="background: rgba(255,255,255,0.3); height: 12px; border-radius: 6px; overflow: hidden; margin: 20px 0 10px 0;">
              <div style="background: white; height: 12px; width: {progressPercent}%; border-radius: 6px; box-shadow: 0 0 10px rgba(255,255,255,0.5);"></div>
            </div>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: right;">{progressPercent}% пройдено</p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="{marathonUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 30px; font-size: 18px; font-weight: 700; box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
              Открыть День {dayNumber} →
            </a>
          </div>

          <!-- Motivation -->
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #065f46; font-weight: 600;">
              💪 Каждый день приближает вас к цели!
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #047857;">
              Уделите 15-20 минут сегодня — это инвестиция в ваше будущее
            </p>
          </div>

          <p style="margin: 25px 0 0 0; font-size: 14px; color: #9ca3af; text-align: center;">
            Следующий день откроется завтра автоматически
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Продолжайте в том же духе! 🌸</p>
        </div>
      </div>
    `
    },
    {
        type: 'completion',
        name: 'Завершение марафона',
        subject: '🏆 Поздравляем! Вы прошли "{marathonTitle}"!',
        description: 'Отправляется по завершении марафона',
        variables: ['marathonTitle', 'completedDays', 'totalDays', 'completionPercent'],
        htmlTemplate: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <!-- Victory header -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 30px; text-align: center; border-radius: 12px 12px 0 0; position: relative;">
          <div style="position: absolute; top: 10px; left: 10px; font-size: 40px; opacity: 0.3;">🎊</div>
          <div style="position: absolute; top: 10px; right: 10px; font-size: 40px; opacity: 0.3;">🎉</div>
          <div style="position: absolute; bottom: 10px; left: 50px; font-size: 35px; opacity: 0.3;">⭐</div>
          <div style="position: absolute; bottom: 10px; right: 50px; font-size: 35px; opacity: 0.3;">✨</div>
          
          <h1 style="margin: 0; color: white; font-size: 64px; position: relative; z-index: 1;">🏆</h1>
          <h2 style="margin: 20px 0 10px 0; color: white; font-size: 36px; font-weight: 700; position: relative; z-index: 1;">Поздравляем!</h2>
          <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 18px; position: relative; z-index: 1;">Вы завершили марафон</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 22px; color: #374151; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
            <strong>{marathonTitle}</strong>
          </p>

          <!-- Achievement card -->
          <div style="background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); padding: 35px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 120px; height: 120px; border-radius: 60px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">
              <p style="margin: 0; font-size: 64px;">✓</p>
            </div>
            
            <p style="margin: 0 0 15px 0; font-size: 48px; color: #10b981; font-weight: 700;">{completionPercent}%</p>
            <p style="margin: 0; font-size: 18px; color: #6b7280;">Выполнено: {completedDays} из {totalDays} дней</p>
          </div>

          <!-- Stats -->
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0 0 20px 0; font-size: 20px; color: #065f46; font-weight: 600; text-align: center;">Ваши достижения:</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 36px;">🎯</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #047857;">Целеустремленность</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 36px;">💪</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #047857;">Сила воли</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 36px;">⭐</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #047857;">Регулярность</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 36px;">🌟</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #047857;">Результат</p>
              </div>
            </div>
          </div>

          <!-- Testimonial style message -->
          <div style="background: #fef3c7; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; font-size: 18px; color: #92400e; font-weight: 600; font-style: italic;">
              "Самая важная победа — это победа над собой"
            </p>
            <p style="margin: 0; font-size: 15px; color: #78350f;">
              Вы проявили удивительную настойчивость и дисциплину. Продолжайте заботиться о себе — это самая важная инвестиция в жизни!
            </p>
          </div>

          <!-- Next steps -->
          <div style="background: #dbeafe; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 15px 0; font-size: 18px; color: #1e40af; font-weight: 600;">💡 Что дальше?</p>
            <p style="margin: 0; font-size: 15px; color: #1e3a8a;">
              Ознакомьтесь с другими нашими марафонами и продолжайте путь к молодости и красоте!
            </p>
          </div>

          <p style="margin: 30px 0 0 0; font-size: 16px; color: #6b7280; text-align: center; font-style: italic;">
            Спасибо, что были с нами! ❤️
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">С гордостью, команда Омолодись 🌸</p>
        </div>
      </div>
    `
    }
];
async function seedEmailTemplates() {
    try {
        console.log('📧 Seeding email templates...\n');
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB\n');
        // Clear existing templates
        await EmailTemplate_model_1.default.deleteMany({});
        console.log('🗑️  Cleared existing templates\n');
        // Insert new templates
        for (const template of templates) {
            await EmailTemplate_model_1.default.create(template);
            console.log(`✅ Created template: ${template.name}`);
        }
        console.log('\n✅ Email templates seeded successfully!\n');
        console.log(`📝 Created ${templates.length} templates:`);
        templates.forEach(t => console.log(`   - ${t.type}: ${t.name}`));
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding email templates:', error);
        process.exit(1);
    }
}
seedEmailTemplates();
