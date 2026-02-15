/**
 * Email Campaign Routes - Visual Flow Builder API
 * Manage automated email sequences
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import EmailCampaign from '../models/EmailCampaign.model';
import EmailTemplate from '../models/EmailTemplate.model';
import EmailLog from '../models/EmailLog.model';
import Marathon from '../models/Marathon.model';

const router = Router();

// Get all campaigns
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await EmailCampaign.find()
      .populate('trigger.marathonId', 'title')
      .populate('steps.templateId', 'name subject type')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single campaign
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('trigger.marathonId', 'title')
      .populate('steps.templateId');
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create campaign
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, trigger, steps, isActive } = req.body;

    const campaign = new EmailCampaign({
      name,
      description,
      trigger,
      steps: steps || [],
      isActive: isActive || false,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      }
    });

    await campaign.save();
    
    const populated = await EmailCampaign.findById(campaign._id)
      .populate('trigger.marathonId', 'title')
      .populate('steps.templateId', 'name subject type');

    res.json({ success: true, campaign: populated });
  } catch (error: any) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update campaign
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, trigger, steps, isActive } = req.body;

    const campaign = await EmailCampaign.findByIdAndUpdate(
      req.params.id,
      { name, description, trigger, steps, isActive },
      { new: true }
    )
      .populate('trigger.marathonId', 'title')
      .populate('steps.templateId', 'name subject type');

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete campaign
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error: any) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle campaign active status
router.post('/:id/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    campaign.isActive = !campaign.isActive;
    await campaign.save();

    res.json({ 
      success: true, 
      campaign,
      message: campaign.isActive ? 'Campaign activated' : 'Campaign deactivated'
    });
  } catch (error: any) {
    console.error('Toggle campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get campaign analytics
router.get('/:id/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Get logs for this campaign
    const logs = await EmailLog.find({ campaignId: campaign._id })
      .sort({ sentAt: -1 })
      .limit(100);

    // Calculate step-by-step stats
    const stepStats = campaign.steps.map(step => {
      const stepLogs = logs.filter(log => log.stepId === step.id);
      const opened = stepLogs.filter(log => log.openedAt).length;
      const clicked = stepLogs.filter(log => log.clickedAt).length;

      return {
        stepId: step.id,
        sent: stepLogs.length,
        opened,
        clicked,
        openRate: stepLogs.length > 0 ? (opened / stepLogs.length * 100).toFixed(1) : '0',
        clickRate: stepLogs.length > 0 ? (clicked / stepLogs.length * 100).toFixed(1) : '0'
      };
    });

    // Recent activity
    const recentActivity = logs.slice(0, 20).map(log => ({
      email: log.email,
      stepId: log.stepId,
      status: log.status,
      sentAt: log.sentAt,
      openedAt: log.openedAt,
      clickedAt: log.clickedAt
    }));

    res.json({
      success: true,
      analytics: {
        overview: campaign.stats,
        stepStats,
        recentActivity,
        totalLogs: logs.length
      }
    });
  } catch (error: any) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate campaign
router.post('/:id/duplicate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const original = await EmailCampaign.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const duplicate = new EmailCampaign({
      name: `${original.name} (копия)`,
      description: original.description,
      trigger: original.trigger,
      steps: original.steps.map(step => ({
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: step.templateId,
        delay: step.delay,
        delayUnit: step.delayUnit,
        condition: step.condition,
        position: step.position
      })),
      isActive: false,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      }
    });

    await duplicate.save();

    const populated = await EmailCampaign.findById(duplicate._id)
      .populate('trigger.marathonId', 'title')
      .populate('steps.templateId', 'name subject type');

    res.json({ success: true, campaign: populated });
  } catch (error: any) {
    console.error('Duplicate campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available triggers for campaign creation
router.get('/meta/triggers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const marathons = await Marathon.find({ isPublic: true })
      .select('title numberOfDays')
      .sort({ createdAt: -1 });

    const triggers = [
      {
        type: 'marathon_enrollment',
        label: 'Запись на марафон',
        description: 'Триггер срабатывает когда пользователь записывается на марафон',
        needsMarathon: true,
        marathons: marathons.map(m => ({ id: m._id, title: m.title }))
      },
      {
        type: 'marathon_start',
        label: 'Старт марафона',
        description: 'Триггер в день начала марафона',
        needsMarathon: true,
        marathons: marathons.map(m => ({ id: m._id, title: m.title }))
      },
      {
        type: 'marathon_day',
        label: 'Определенный день марафона',
        description: 'Триггер в конкретный день марафона (например, день 7)',
        needsMarathon: true,
        needsDayNumber: true,
        marathons: marathons.map(m => ({ id: m._id, title: m.title, days: m.numberOfDays }))
      },
      {
        type: 'marathon_completion',
        label: 'Завершение марафона',
        description: 'Триггер после последнего дня марафона',
        needsMarathon: true,
        marathons: marathons.map(m => ({ id: m._id, title: m.title }))
      },
      {
        type: 'premium_purchased',
        label: 'Покупка премиум',
        description: 'Триггер при успешной оплате премиум подписки',
        needsMarathon: false
      },
      {
        type: 'manual',
        label: 'Ручной запуск',
        description: 'Кампания запускается вручную админом',
        needsMarathon: false
      }
    ];

    res.json({ success: true, triggers });
  } catch (error: any) {
    console.error('Get triggers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
