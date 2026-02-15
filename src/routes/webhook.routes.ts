/**
 * Webhook Routes - Resend Email Events
 * Updates EmailLog with delivery, open, click, bounce events
 */

import { Router, Request, Response } from 'express';
import EmailLog from '../models/EmailLog.model';
import EmailCampaign from '../models/EmailCampaign.model';

const router = Router();

/**
 * Resend webhook endpoint
 * Documentation: https://resend.com/docs/dashboard/webhooks/event-types
 */
router.post('/resend', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    
    console.log('[Webhook] Received Resend event:', event.type);

    // Event types: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
    const { type, data } = event;

    if (!data || !data.email_id) {
      console.warn('[Webhook] Invalid event data:', event);
      return res.status(400).json({ error: 'Invalid event data' });
    }

    const providerId = data.email_id;

    // Find the email log by providerId
    const emailLog = await EmailLog.findOne({ providerId });

    if (!emailLog) {
      console.warn('[Webhook] Email log not found for providerId:', providerId);
      // Return 200 to acknowledge receipt (don't let Resend retry)
      return res.json({ received: true, message: 'Log not found' });
    }

    // Update log based on event type
    switch (type) {
      case 'email.sent':
        // Already logged when sending
        break;

      case 'email.delivered':
        emailLog.status = 'delivered';
        emailLog.deliveredAt = new Date();
        
        // Update campaign stats
        if (emailLog.campaignId) {
          await EmailCampaign.updateOne(
            { _id: emailLog.campaignId },
            { $inc: { 'stats.delivered': 1 } }
          );
        }
        break;

      case 'email.opened':
        if (!emailLog.openedAt) {
          emailLog.openedAt = new Date();
          
          // Update campaign stats (only count first open)
          if (emailLog.campaignId) {
            await EmailCampaign.updateOne(
              { _id: emailLog.campaignId },
              { $inc: { 'stats.opened': 1 } }
            );
          }
        }
        break;

      case 'email.clicked':
        if (!emailLog.clickedAt) {
          emailLog.clickedAt = new Date();
          
          // Update campaign stats (only count first click)
          if (emailLog.campaignId) {
            await EmailCampaign.updateOne(
              { _id: emailLog.campaignId },
              { $inc: { 'stats.clicked': 1 } }
            );
          }
        }
        break;

      case 'email.bounced':
        emailLog.status = 'bounced';
        emailLog.bouncedAt = new Date();
        emailLog.error = data.bounce_type || 'bounced';
        
        // Update campaign stats
        if (emailLog.campaignId) {
          await EmailCampaign.updateOne(
            { _id: emailLog.campaignId },
            { $inc: { 'stats.bounced': 1 } }
          );
        }
        break;

      case 'email.complained':
        // User marked as spam
        emailLog.error = 'spam_complaint';
        
        if (emailLog.campaignId) {
          await EmailCampaign.updateOne(
            { _id: emailLog.campaignId },
            { $inc: { 'stats.unsubscribed': 1 } }
          );
        }
        break;

      default:
        console.log('[Webhook] Unhandled event type:', type);
    }

    await emailLog.save();

    console.log(`[Webhook] Updated log ${emailLog._id} with event ${type}`);

    res.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check for webhook endpoint
 */
router.get('/resend', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'Resend webhook handler',
    timestamp: new Date().toISOString()
  });
});

export default router;
