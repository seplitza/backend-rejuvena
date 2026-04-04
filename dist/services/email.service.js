"use strict";
/**
 * Email Service for sending registration emails
 * Using Resend (100 emails/day free forever)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
class EmailService {
    constructor() {
        this.resend = null;
        const apiKey = process.env.RESEND_API_KEY;
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@rejuvena.com';
        if (apiKey) {
            this.resend = new resend_1.Resend(apiKey);
            console.log('✅ Resend email service initialized');
        }
        else {
            console.warn('⚠️ RESEND_API_KEY not configured - emails will not be sent');
        }
    }
    /**
     * Generate random 4-digit password
     */
    generatePassword() {
        // Generate 4-digit password (1000-9999)
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
    /**
     * Send registration email with generated password
     */
    async sendRegistrationEmail(email, password) {
        if (!this.resend) {
            console.error('❌ Resend not initialized - cannot send email');
            return false;
        }
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Добро пожаловать в Rejuvena! Ваш пароль для входа',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Добро пожаловать в Rejuvena! 🎉</h2>
            
            <p>Ваш аккаунт успешно создан.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Email:</p>
              <p style="margin: 5px 0 15px 0; font-size: 16px; font-weight: bold;">${email}</p>
              
              <p style="margin: 0; font-size: 14px; color: #666;">Временный пароль:</p>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #4CAF50; font-family: monospace;">${password}</p>
            </div>
            
            <p>Войдите в приложение используя эти данные.</p>
            
            <p style="color: #ff9800; font-weight: bold;">⚠️ Рекомендуем сменить пароль после первого входа в настройках профиля.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              Если вы не регистрировались в Rejuvena, проигнорируйте это письмо.
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`✅ Registration email sent to ${email} (ID: ${result.data?.id})`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send registration email:', error);
            return false;
        }
    }
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, newPassword) {
        if (!this.resend) {
            console.error('Cannot send email - Resend not initialized');
            return false;
        }
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Восстановление пароля - Rejuvena',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Восстановление пароля</h2>
            
            <p>Ваш новый временный пароль:</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
              <h1 style="color: #7c3aed; font-size: 36px; margin: 0; letter-spacing: 4px;">${newPassword}</h1>
            </div>
            
            <p>Используйте этот пароль для входа в Ваш аккаунт.</p>
            
            <p style="color: #e53e3e; font-weight: bold;">
              Пожалуйста, измените этот пароль в настройках профиля после входа!
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Если Вы не запрашивали восстановление пароля, пожалуйста, свяжитесь с нами немедленно.
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`Password reset email sent to ${email} (ID: ${result.data?.id})`);
            return true;
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            return false;
        }
    }
    /**
     * Send marathon enrollment confirmation email
     */
    async sendMarathonEnrollmentEmail(email, marathonTitle, startDate, isPaid, telegramGroupUrl) {
        if (!this.resend) {
            console.error('❌ Resend not initialized - cannot send email');
            return false;
        }
        try {
            const startDateStr = new Date(startDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `Вы записаны на марафон "${marathonTitle}" 🏃`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Поздравляем! 🎉</h2>
            
            <p>Вы успешно записаны на марафон:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #4CAF50;">${marathonTitle}</h3>
              <p style="margin: 5px 0; font-size: 16px;">
                <strong>Дата старта:</strong> ${startDateStr}
              </p>
              ${isPaid ? '<p style="margin: 5px 0; color: #ff9800;">💳 Оплачено</p>' : '<p style="margin: 5px 0; color: #2196F3;">🎁 Бесплатный марафон</p>'}
            </div>
            
            <p>Доступ к упражнениям откроется в день старта марафона. Каждый день будет открываться по одному новому дню марафона.</p>
            
            ${telegramGroupUrl ? `
              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">📱 Присоединяйтесь к группе в Telegram</h3>
                <p style="margin: 5px 0;">Там выходят прямые эфиры с автором</p>
                <a href="${telegramGroupUrl}" style="display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                  Открыть группу →
                </a>
              </div>
            ` : ''}
            
            <p style="color: #666; font-size: 14px;">
              Мы отправим вам напоминание перед стартом марафона.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              До встречи на марафоне! 🌟
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`✅ Marathon enrollment email sent to ${email} (ID: ${result.data?.id})`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send marathon enrollment email:', error);
            return false;
        }
    }
    /**
     * Send reminder email one day before marathon starts
     */
    async sendMarathonReminderEmail(email, marathonTitle, startDate) {
        if (!this.resend) {
            console.error('❌ Resend not initialized - cannot send email');
            return false;
        }
        try {
            const startDateStr = new Date(startDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `Завтра стартует "${marathonTitle}"! 🚀`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Готовы к старту? 🏃</h2>
            
            <p>Завтра начинается ваш марафон:</p>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
              <h3 style="margin: 0 0 10px 0; color: #1976D2;">${marathonTitle}</h3>
              <p style="margin: 5px 0; font-size: 18px;">
                <strong>Старт:</strong> ${startDateStr}
              </p>
            </div>
            
            <p><strong>Что вас ждёт:</strong></p>
            <ul>
              <li>Первый день откроется завтра автоматически</li>
              <li>Новые упражнения каждый день</li>
              <li>Поддержка и мотивация от нашей команды</li>
            </ul>
            
            <p style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              💡 <strong>Совет:</strong> Установите напоминание на телефоне, чтобы не пропустить ежедневные упражнения!
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              Увидимся на марафоне! 🌟
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`✅ Marathon reminder email sent to ${email} (ID: ${result.data?.id})`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send marathon reminder email:', error);
            return false;
        }
    }
    /**
     * Send email on marathon start day
     */
    async sendMarathonStartEmail(email, marathonTitle, numberOfDays) {
        if (!this.resend) {
            console.error('❌ Resend not initialized - cannot send email');
            return false;
        }
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `🎉 Марафон "${marathonTitle}" стартовал!`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 8px; text-align: center; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 32px;">🏃 Старт!</h1>
              <p style="margin: 10px 0 0 0; font-size: 20px;">${marathonTitle}</p>
            </div>
            
            <p style="font-size: 18px;"><strong>Поздравляем с началом марафона!</strong></p>
            
            <p>Первый день уже доступен в вашем личном кабинете.</p>
            
            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">
                <strong>📅 Продолжительность:</strong> ${numberOfDays} дней
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Каждый день будет автоматически открываться новый набор упражнений
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://seplitza.github.io/rejuvena/marathons" 
                 style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Начать День 1
              </a>
            </div>
            
            <p style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              💪 <strong>Важно:</strong> Выполняйте упражнения регулярно, чтобы получить максимальный результат!
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              Удачи в марафоне! Мы верим в вас! 🌟
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`✅ Marathon start email sent to ${email} (ID: ${result.data?.id})`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send marathon start email:', error);
            return false;
        }
    }
    /**
     * Send daily reminder email for active marathon
     */
    async sendMarathonDailyReminderEmail(email, marathonTitle, dayNumber, totalDays) {
        if (!this.resend) {
            console.error('❌ Resend not initialized - cannot send email');
            return false;
        }
        try {
            const progress = Math.round((dayNumber / totalDays) * 100);
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `День ${dayNumber}/${totalDays}: ${marathonTitle} 🌅`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Доброе утро! ☀️</h2>
            
            <p>Новый день марафона уже доступен:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">${marathonTitle}</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
                День ${dayNumber} из ${totalDays}
              </p>
              
              <div style="background-color: #e0e0e0; height: 10px; border-radius: 5px; margin: 15px 0;">
                <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 10px; border-radius: 5px; width: ${progress}%;"></div>
              </div>
              
              <p style="margin: 5px 0; color: #666;">Прогресс: ${progress}%</p>
            </div>
            
            <p>Уделите время упражнениям сегодня, чтобы не отставать от графика!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://seplitza.github.io/rejuvena/marathons" 
                 style="display: inline-block; background-color: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Открыть День ${dayNumber}
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Продолжайте в том же духе! 💪
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`✅ Marathon daily reminder sent to ${email} (Day ${dayNumber}/${totalDays})`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send marathon daily reminder:', error);
            return false;
        }
    }
    /**
     * Send marathon completion email
     */
    async sendMarathonCompletionEmail(email, marathonTitle, totalDays, completedDays) {
        if (!this.resend) {
            console.error('❌ Resend not initialized - cannot send email');
            return false;
        }
        try {
            const completionRate = Math.round((completedDays / totalDays) * 100);
            const isFullyCompleted = completedDays === totalDays;
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: isFullyCompleted
                    ? `🎊 Поздравляем с завершением "${marathonTitle}"!`
                    : `Марафон "${marathonTitle}" завершён`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 8px; text-align: center; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 40px;">${isFullyCompleted ? '🎊' : '🏁'}</h1>
              <h2 style="margin: 10px 0; font-size: 28px;">${isFullyCompleted ? 'Поздравляем!' : 'Марафон завершён'}</h2>
              <p style="margin: 10px 0 0 0; font-size: 18px;">${marathonTitle}</p>
            </div>
            
            ${isFullyCompleted ? `
              <p style="font-size: 18px;"><strong>Вы прошли все ${totalDays} дней марафона!</strong></p>
              
              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 48px;">100%</p>
                <p style="margin: 10px 0 0 0; color: #2e7d32; font-weight: bold;">Выполнено полностью</p>
              </div>
              
              <p>Это огромное достижение! Вы проявили целеустремлённость и силу воли. 💪</p>
              
              <ul>
                <li>✅ Пройдено дней: ${completedDays}/${totalDays}</li>
                <li>🎯 Выполненных упражнений: весь курс</li>
                <li>⭐ Результат: Отлично!</li>
              </ul>
            ` : `
              <p>Марафон "${marathonTitle}" завершился.</p>
              
              <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 48px;">${completionRate}%</p>
                <p style="margin: 10px 0 0 0; color: #e65100;">Выполнено: ${completedDays} из ${totalDays} дней</p>
              </div>
              
              <p>Вы можете продолжить выполнение упражнений в своём темпе.</p>
            `}
            
            <p style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
              💡 <strong>Что дальше?</strong> Ознакомьтесь с другими нашими марафонами и курсами для продолжения развития!
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://seplitza.github.io/rejuvena/marathons" 
                 style="display: inline-block; background-color: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Смотреть другие марафоны
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Спасибо, что были с нами! 🌟
            </p>
          </div>
        `,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${email}:`, result.error);
                return false;
            }
            console.log(`✅ Marathon completion email sent to ${email}`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send marathon completion email:', error);
            return false;
        }
    }
    /**
     * Generic email sending method
     */
    async sendEmail(params) {
        if (!this.resend) {
            console.warn('⚠️ Email service not configured');
            return false;
        }
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: params.to,
                subject: params.subject,
                html: params.html,
            });
            if (result.error) {
                console.error(`❌ Resend API error for ${params.to}:`, result.error);
                return false;
            }
            console.log(`✅ Email sent to ${params.to}: ${params.subject}`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send email:', error);
            return false;
        }
    }
}
exports.default = new EmailService();
