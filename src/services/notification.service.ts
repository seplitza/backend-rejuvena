/**
 * Notification Service
 * Multi-channel notifications: Telegram, VK, WhatsApp, Viber, SMS
 */

import axios from 'axios';
import User from '../models/User.model';

interface NotificationPayload {
  userId: string;
  message: string;
  channel?: 'telegram' | 'vk' | 'whatsapp' | 'viber' | 'sms' | 'email';
}

export class NotificationService {
  /**
   * Send notification to user (auto-select preferred channel)
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const user = await User.findById(payload.userId);
      if (!user) {
        console.error('User not found:', payload.userId);
        return false;
      }

      // Use specified channel or user's preferred method
      const channel = payload.channel || user.preferredContactMethod || 'email';

      switch (channel) {
        case 'telegram':
          return await this.sendTelegram(user.phone || '', payload.message);
        
        case 'vk':
          if (user.vkUserId) {
            return await this.sendVK(user.vkUserId, payload.message);
          }
          break;
        
        case 'whatsapp':
          if (user.whatsappPhone) {
            return await this.sendWhatsApp(user.whatsappPhone, payload.message);
          }
          break;
        
        case 'viber':
          if (user.viberPhone) {
            return await this.sendViber(user.viberPhone, payload.message);
          }
          break;
        
        case 'sms':
          if (user.phone) {
            return await this.sendSMS(user.phone, payload.message);
          }
          break;
        
        case 'email':
          if (user.email) {
            return await this.sendEmail(user.email, payload.message);
          }
          break;
      }

      // Fallback to email if preferred method fails
      if (channel !== 'email' && user.email) {
        return await this.sendEmail(user.email, payload.message);
      }

      return false;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send Telegram message
   */
  async sendTelegram(phoneOrChatId: string, message: string): Promise<boolean> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        console.warn('Telegram bot token not configured');
        return false;
      }

      // If phoneOrChatId is a number (chat_id), use it directly
      // Otherwise, need to resolve phone to chat_id (requires user to start bot first)
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: phoneOrChatId,
        text: message,
        parse_mode: 'HTML'
      });

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  /**
   * Send VK message
   */
  async sendVK(vkUserId: string, message: string): Promise<boolean> {
    try {
      const accessToken = process.env.VK_ACCESS_TOKEN;
      const groupId = process.env.VK_GROUP_ID;

      if (!accessToken || !groupId) {
        console.warn('VK credentials not configured');
        return false;
      }

      await axios.get('https://api.vk.com/method/messages.send', {
        params: {
          user_id: vkUserId,
          message,
          random_id: Math.floor(Math.random() * 1000000),
          access_token: accessToken,
          v: '5.131'
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending VK message:', error);
      return false;
    }
  }

  /**
   * Send WhatsApp message (via WhatsApp Business API)
   */
  async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
      const apiUrl = process.env.WHATSAPP_API_URL;
      const apiKey = process.env.WHATSAPP_API_KEY;

      if (!apiUrl || !apiKey) {
        console.warn('WhatsApp API not configured');
        return false;
      }

      // Format phone: remove + and spaces
      const formattedPhone = phone.replace(/[^0-9]/g, '');

      await axios.post(
        `${apiUrl}/messages`,
        {
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send Viber message
   */
  async sendViber(phone: string, message: string): Promise<boolean> {
    try {
      const authToken = process.env.VIBER_AUTH_TOKEN;
      const senderName = process.env.VIBER_SENDER_NAME || 'Seplitza';

      if (!authToken) {
        console.warn('Viber auth token not configured');
        return false;
      }

      await axios.post(
        'https://chatapi.viber.com/pa/send_message',
        {
          receiver: phone,
          type: 'text',
          text: message,
          sender: {
            name: senderName
          }
        },
        {
          headers: {
            'X-Viber-Auth-Token': authToken,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error sending Viber message:', error);
      return false;
    }
  }

  /**
   * Send SMS (via SMS.ru)
   */
  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const apiId = process.env.SMS_RU_API_ID;
      if (!apiId) {
        console.warn('SMS.ru API ID not configured');
        return false;
      }

      // Format phone: must start with 7 (Russia)
      const formattedPhone = phone.replace(/^8/, '7').replace(/[^0-9]/g, '');

      const response = await axios.post(
        'https://sms.ru/sms/send',
        new URLSearchParams({
          api_id: apiId,
          to: formattedPhone,
          msg: message,
          json: '1'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data?.status === 'OK';
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Send email (placeholder - integrate with existing email service)
   */
  async sendEmail(email: string, message: string): Promise<boolean> {
    try {
      // TODO: Integrate with existing Resend/email service from Rejuvena
      console.log(`Would send email to ${email}: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send order status update to customer
   */
  async sendOrderUpdate(orderId: string, status: string, customMessage?: string): Promise<boolean> {
    try {
      // TODO: Fetch order and format message
      const message = customMessage || `Статус вашего заказа #${orderId} изменен: ${status}`;
      
      // Send to customer (implement logic to get userId from order)
      // const order = await Order.findById(orderId);
      // return await this.sendNotification({ userId: order.user, message });
      
      console.log(`Order update notification: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending order update:', error);
      return false;
    }
  }

  /**
   * Send Fortune Wheel prize notification
   */
  async sendPrizeNotification(userId: string, prizeName: string, expiry: Date): Promise<boolean> {
    const message = `🎉 Поздравляем! Вы выиграли: ${prizeName}!\nПриз действителен до ${expiry.toLocaleDateString('ru-RU')}`;
    return await this.sendNotification({ userId, message });
  }

  /**
   * Send promo code notification
   */
  async sendPromoCode(userId: string, code: string, description: string): Promise<boolean> {
    const message = `🎁 Ваш промокод: ${code}\n${description}`;
    return await this.sendNotification({ userId, message });
  }
}

export default new NotificationService();
