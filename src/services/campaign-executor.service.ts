/**
 * Campaign Executor Service
 * Automated email sequence execution with conditional logic
 */

import EmailCampaign from '../models/EmailCampaign.model';
import EmailLog from '../models/EmailLog.model';
import EmailTemplate from '../models/EmailTemplate.model';
import Marathon from '../models/Marathon.model';
import MarathonEnrollment from '../models/MarathonEnrollment.model';
import User from '../models/User.model';
import Payment from '../models/Payment.model';

interface CampaignExecutionContext {
  userId: string;
  email: string;
  campaignId: string;
  stepId: string;
  templateData: Record<string, any>;
}

export class CampaignExecutor {
  /**
   * Process all active campaigns
   * Should be called by cron job every hour
   */
  async processCampaigns(): Promise<void> {
    console.log('[CampaignExecutor] Starting campaign processing...');
    
    try {
      const activeCampaigns = await EmailCampaign.find({ isActive: true });
      console.log(`[CampaignExecutor] Found ${activeCampaigns.length} active campaigns`);

      for (const campaign of activeCampaigns) {
        try {
          await this.processCampaign(campaign);
        } catch (error: any) {
          console.error(`[CampaignExecutor] Error processing campaign ${campaign._id}:`, error);
        }
      }

      console.log('[CampaignExecutor] Campaign processing completed');
    } catch (error: any) {
      console.error('[CampaignExecutor] Error in processCampaigns:', error);
    }
  }

  /**
   * Process a single campaign
   */
  private async processCampaign(campaign: any): Promise<void> {
    console.log(`[CampaignExecutor] Processing campaign: ${campaign.name}`);

    // Get users who match the trigger
    const users = await this.getUsersForTrigger(campaign);
    console.log(`[CampaignExecutor] Found ${users.length} users for trigger ${campaign.trigger.type}`);

    for (const user of users) {
      try {
        await this.processUserCampaign(campaign, user);
      } catch (error: any) {
        console.error(`[CampaignExecutor] Error processing user ${user._id} for campaign ${campaign._id}:`, error);
      }
    }
  }

  /**
   * Get users who match the campaign trigger
   */
  private async getUsersForTrigger(campaign: any): Promise<any[]> {
    const trigger = campaign.trigger;

    switch (trigger.type) {
      case 'marathon_enrollment':
        return await this.getUsersForMarathonEnrollment(trigger.marathonId);

      case 'marathon_start':
        return await this.getUsersForMarathonStart(trigger.marathonId);

      case 'marathon_day':
        return await this.getUsersForMarathonDay(trigger.marathonId, trigger.dayNumber);

      case 'marathon_completion':
        return await this.getUsersForMarathonCompletion(trigger.marathonId);

      case 'premium_purchased':
        return await this.getUsersForPremiumPurchase();

      case 'manual':
        // Manual campaigns don't auto-trigger
        return [];

      default:
        console.warn(`[CampaignExecutor] Unknown trigger type: ${trigger.type}`);
        return [];
    }
  }

  /**
   * Users who enrolled in marathon in last 24 hours (not already received)
   */
  private async getUsersForMarathonEnrollment(marathonId: string): Promise<any[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const enrollments = await MarathonEnrollment.find({
      marathonId,
      enrolledAt: { $gte: yesterday }
    }).populate('userId');

    return enrollments
      .map((e: any) => e.userId)
      .filter((u: any) => u && u.email);
  }

  /**
   * Users enrolled in marathon that starts today
   */
  private async getUsersForMarathonStart(marathonId: string): Promise<any[]> {
    const marathon = await Marathon.findById(marathonId);
    if (!marathon) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (marathon.startDate < today || marathon.startDate >= tomorrow) {
      return []; // Not starting today
    }

    const enrollments = await MarathonEnrollment.find({ marathonId }).populate('userId');
    return enrollments
      .map((e: any) => e.userId)
      .filter((u: any) => u && u.email);
  }

  /**
   * Users who are on specific day of marathon
   */
  private async getUsersForMarathonDay(marathonId: string, dayNumber: number): Promise<any[]> {
    const marathon = await Marathon.findById(marathonId);
    if (!marathon) return [];

    const targetDate = new Date(marathon.startDate);
    targetDate.setDate(targetDate.getDate() + dayNumber - 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (targetDate < today || targetDate >= tomorrow) {
      return []; // Not the right day
    }

    const enrollments = await MarathonEnrollment.find({ marathonId }).populate('userId');
    return enrollments
      .map((e: any) => e.userId)
      .filter((u: any) => u && u.email);
  }

  /**
   * Users who completed marathon (last day was yesterday)
   */
  private async getUsersForMarathonCompletion(marathonId: string): Promise<any[]> {
    const marathon = await Marathon.findById(marathonId);
    if (!marathon) return [];

    const lastDay = new Date(marathon.startDate);
    lastDay.setDate(lastDay.getDate() + marathon.numberOfDays - 1);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    if (lastDay < yesterday || lastDay >= today) {
      return []; // Not completion day
    }

    const enrollments = await MarathonEnrollment.find({ marathonId }).populate('userId');
    return enrollments
      .map((e: any) => e.userId)
      .filter((u: any) => u && u.email);
  }

  /**
   * Users who purchased premium in last 24 hours
   */
  private async getUsersForPremiumPurchase(): Promise<any[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const payments = await Payment.find({
      status: 'success',
      createdAt: { $gte: yesterday }
    }).populate('userId');

    return payments
      .map((p: any) => p.userId)
      .filter((u: any) => u && u.email);
  }

  /**
   * Process campaign for specific user (determine which step to send)
   */
  private async processUserCampaign(campaign: any, user: any): Promise<void> {
    // Get all logs for this user in this campaign
    const logs = await EmailLog.find({
      campaignId: campaign._id,
      userId: user._id
    }).sort({ sentAt: 1 });

    // If no logs, user hasn't started campaign yet
    if (logs.length === 0) {
      // Send first step
      const firstStep = campaign.steps[0];
      if (firstStep) {
        await this.sendCampaignStep(campaign, firstStep, user, null);
      }
      return;
    }

    // Find next step to send
    const lastLog = logs[logs.length - 1];
    const lastStepIndex = campaign.steps.findIndex((s: any) => s.id === lastLog.stepId);
    
    if (lastStepIndex === -1 || lastStepIndex >= campaign.steps.length - 1) {
      // Campaign completed for this user
      return;
    }

    const nextStep = campaign.steps[lastStepIndex + 1];
    
    // Check delay
    const delayMs = nextStep.delayUnit === 'hours' 
      ? nextStep.delay * 60 * 60 * 1000 
      : nextStep.delay * 24 * 60 * 60 * 1000;
    
    const nextSendTime = new Date(lastLog.sentAt.getTime() + delayMs);
    
    if (nextSendTime > new Date()) {
      // Not time yet
      return;
    }

    // Check condition
    if (nextStep.condition && nextStep.condition.type !== 'all') {
      const conditionMet = await this.checkCondition(nextStep.condition, logs);
      if (!conditionMet) {
        console.log(`[CampaignExecutor] Condition not met for user ${user._id}, step ${nextStep.id}`);
        return;
      }
    }

    // Send the step
    await this.sendCampaignStep(campaign, nextStep, user, lastLog);
  }

  /**
   * Check if condition is met based on previous step engagement
   */
  private async checkCondition(condition: any, logs: any[]): Promise<boolean> {
    const refStepLog = logs.find(log => log.stepId === condition.stepId);
    if (!refStepLog) return false;

    switch (condition.type) {
      case 'opened':
        return !!refStepLog.openedAt;
      
      case 'clicked':
        return !!refStepLog.clickedAt;
      
      case 'not_opened':
        return !refStepLog.openedAt;
      
      default:
        return true;
    }
  }

  /**
   * Send a campaign step email
   */
  private async sendCampaignStep(campaign: any, step: any, user: any, previousLog: any | null): Promise<void> {
    try {
      // Get template
      const template = await EmailTemplate.findById(step.templateId);
      if (!template || !template.isActive) {
        console.warn(`[CampaignExecutor] Template ${step.templateId} not found or inactive`);
        return;
      }

      // Build template data
      const templateData = await this.buildTemplateData(campaign, user);

      // Replace variables in template
      let htmlContent = template.htmlTemplate;
      let subject = template.subject;

      Object.keys(templateData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, templateData[key]);
        subject = subject.replace(regex, templateData[key]);
      });

      // Send email via Resend
      const result = await sendEmail({
        to: user.email,
        subject,
        html: htmlContent
      });

      // Log the send
      const emailLog = new EmailLog({
        campaignId: campaign._id,
        stepId: step.id,
        templateId: template._id,
        userId: user._id,
        email: user.email,
        subject,
        status: 'sent',
        provider: 'resend',
        providerId: result?.id || '',
        sentAt: new Date()
      });

      await emailLog.save();

      // Update campaign stats
      await EmailCampaign.updateOne(
        { _id: campaign._id },
        { $inc: { 'stats.sent': 1 } }
      );

      console.log(`[CampaignExecutor] Sent campaign ${campaign._id} step ${step.id} to ${user.email}`);
    } catch (error: any) {
      console.error(`[CampaignExecutor] Error sending campaign step:`, error);
      
      // Log failed send
      const emailLog = new EmailLog({
        campaignId: campaign._id,
        stepId: step.id,
        templateId: step.templateId,
        userId: user._id,
        email: user.email,
        subject: '',
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      });

      await emailLog.save();
    }
  }

  /**
   * Build template data for variable replacement
   */
  private async buildTemplateData(campaign: any, user: any): Promise<Record<string, any>> {
    const data: Record<string, any> = {
      firstName: user.firstName || user.email.split('@')[0],
      lastName: user.lastName || '',
      email: user.email,
      siteUrl: 'https://seplitza.github.io/rejuvena'
    };

    // Add marathon data if applicable
    if (campaign.trigger.marathonId) {
      const marathon = await Marathon.findById(campaign.trigger.marathonId);
      if (marathon) {
        data.marathonTitle = marathon.title;
        data.numberOfDays = marathon.numberOfDays;
        data.startDate = marathon.startDate.toLocaleDateString('ru-RU');
        data.marathonUrl = `https://seplitza.github.io/rejuvena/marathons/${marathon._id}`;
        
        if (campaign.trigger.dayNumber) {
          data.dayNumber = campaign.trigger.dayNumber;
          data.totalDays = marathon.numberOfDays;
        }
      }
    }

    return data;
  }
}

// Helper function to send email via Resend
async function sendEmail(options: { to: string; subject: string; html: string }): Promise<any> {
  const Resend = require('resend').Resend;
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  return await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@mail.seplitza.ru',
    to: options.to,
    subject: options.subject,
    html: options.html
  });
}

export const campaignExecutor = new CampaignExecutor();
