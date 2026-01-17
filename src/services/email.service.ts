/**
 * Email Service for sending registration emails
 * Using Resend (100 emails/day free forever)
 */

import { Resend } from 'resend';

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@rejuvena.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log('✅ Resend email service initialized');
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured - emails will not be sent');
    }
  }

  /**
   * Generate random 4-digit password
   */
  generatePassword(): string {
    // Generate 4-digit password (1000-9999)
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Send registration email with generated password
   */
  async sendRegistrationEmail(email: string, password: string): Promise<boolean> {
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
    } catch (error) {
      console.error('❌ Failed to send registration email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    if (!this.resend) {
      console.error('❌ Resend not initialized - cannot send email');
      return false;
    }

    const resetLink = `${process.env.FRONTEND_URL || 'https://seplitza.github.io/rejuvena'}/reset-password?token=${resetToken}`;

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Восстановление пароля Rejuvena',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Восстановление пароля</h2>
            
            <p>Вы запросили восстановление пароля для вашего аккаунта Rejuvena.</p>
            
            <p>Перейдите по ссылке ниже для установки нового пароля:</p>
            
            <div style="margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Восстановить пароль
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Ссылка действительна в течение 1 часа.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
            </p>
          </div>
        `,
      });

      if (result.error) {
        console.error(`❌ Resend API error for ${email}:`, result.error);
        return false;
      }

      console.log(`✅ Password reset email sent to ${email} (ID: ${result.data?.id})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }
}

export default new EmailService();
