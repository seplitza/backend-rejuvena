"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Get all tags
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        // Админка должна видеть ВСЕ теги, включая скрытые (isVisible: false)
        // Это нужно для работы с тегами дней типа "День 1", "День 2" и т.д.
        const tags = await Tag_model_1.default.find({}).sort({ name: 1 });
        res.json(tags);
    }
    catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Create tag
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        // Create slug from name
        let slug = name.toLowerCase()
            .trim()
            .replace(/[а-яё]/g, (char) => {
            const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
            const en = 'abvgdeejzijklmnoprstufhccss_y_eua';
            const index = ru.indexOf(char);
            return index >= 0 ? en[index] : char;
        })
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+|-+$/g, '');
        // Check if slug exists and add number if needed
        let finalSlug = slug;
        let counter = 1;
        while (await Tag_model_1.default.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }
        const tag = new Tag_model_1.default({
            name: name.trim(),
            slug: finalSlug,
            color: color || '#3B82F6'
        });
        await tag.save();
        res.status(201).json(tag);
    }
    catch (error) {
        console.error('Create tag error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
// Delete tag
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const tag = await Tag_model_1.default.findByIdAndDelete(req.params.id);
        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }
        res.json({ message: 'Tag deleted successfully' });
    }
    catch (error) {
        console.error('Delete tag error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
