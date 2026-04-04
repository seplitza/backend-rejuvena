"use strict";
/**
 * Email Template Admin Routes
 * API for managing email templates (admin only)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const EmailTemplate_model_1 = __importDefault(require("../models/EmailTemplate.model"));
const router = (0, express_1.Router)();
// Get all email templates
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const templates = await EmailTemplate_model_1.default.find().sort({ type: 1 });
        res.json({ success: true, templates });
    }
    catch (error) {
        console.error('Get email templates error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get single email template
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const template = await EmailTemplate_model_1.default.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, template });
    }
    catch (error) {
        console.error('Get email template error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create email template
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { type, name, subject, htmlTemplate, variables, description, isActive, language } = req.body;
        const template = new EmailTemplate_model_1.default({
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
    }
    catch (error) {
        console.error('Create email template error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update email template
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { name, subject, htmlTemplate, variables, description, isActive } = req.body;
        const template = await EmailTemplate_model_1.default.findByIdAndUpdate(req.params.id, {
            name,
            subject,
            htmlTemplate,
            variables,
            description,
            isActive
        }, { new: true });
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, template });
    }
    catch (error) {
        console.error('Update email template error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Delete email template
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const template = await EmailTemplate_model_1.default.findByIdAndDelete(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, message: 'Template deleted' });
    }
    catch (error) {
        console.error('Delete email template error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Preview email template (replace variables with sample data)
router.post('/:id/preview', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const template = await EmailTemplate_model_1.default.findById(req.params.id);
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
    }
    catch (error) {
        console.error('Preview email template error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
