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

  async sendPasswordResetEmail(email: string, newPassword: string): Promise<boolean> {
    if (!this.resend) {
      console.error('Cannot send email - Resend not initialized');
      return false;
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Password Reset - Rejuvena',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset</h2>
            
            <p>Your new temporary password:</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
              <h1 style="color: #7c3aed; font-size: 36px; margin: 0; letter-spacing: 4px;">${newPassword}</h1>
            </div>
            
            <p>Use this password to log in to your account.</p>
            
            <p style="color: #e53e3e; font-weight: bold;">
              Please change this password in your profile settings after logging in!
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you did not request a password re et, please contact us immediately.
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
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}

export default new EmailService();
