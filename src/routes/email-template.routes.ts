/**
 * Email Template Admin Routes
 * API for managing email templates (admin only)
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import EmailTemplate from '../models/EmailTemplate.model';

const router = Router();

// Get all email templates
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await EmailTemplate.find().sort({ type: 1 });
    res.json({ success: true, templates });
  } catch (error: any) {
    console.error('Get email templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single email template
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (error: any) {
    console.error('Get email template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create email template
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type, name, subject, htmlTemplate, variables, description, isActive, language } = req.body;

    const template = new EmailTemplate({
      type,
      name,
      subject,
      htmlTemplate,
      variables: variables || [],
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      language: language || 'ru'
    });

    await template.save();
    res.json({ success: true, template });
  } catch (error: any) {
    console.error('Create email template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update email template
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, subject, htmlTemplate, variables, description, isActive } = req.body;

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        subject,
        htmlTemplate,
        variables,
        description,
        isActive
      },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error: any) {
    console.error('Update email template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete email template
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    console.error('Delete email template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Preview email template (replace variables with sample data)
router.post('/:id/preview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const { sampleData } = req.body;

    let previewHtml = template.htmlTemplate;
    let previewSubject = template.subject;

    // Replace variables with sample data
    if (sampleData) {
      Object.keys(sampleData).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        previewHtml = previewHtml.replace(regex, sampleData[key]);
        previewSubject = previewSubject.replace(regex, sampleData[key]);
      });
    }

    res.json({
      success: true,
      preview: {
        subject: previewSubject,
        html: previewHtml
      }
    });
  } catch (error: any) {
    console.error('Preview email template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
