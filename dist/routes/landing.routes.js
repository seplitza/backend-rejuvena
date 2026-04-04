"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Landing_model_1 = __importDefault(require("../models/Landing.model"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ============ ADMIN ENDPOINTS (Protected) ============
// GET /api/landings - Получить все лендинги (для админки)
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', published } = req.query;
        const query = {};
        // Фильтр по статусу публикации
        if (published !== undefined) {
            query.isPublished = published === 'true';
        }
        // Поиск по названию или slug
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [landings, total] = await Promise.all([
            Landing_model_1.default.find(query)
                .populate('createdBy', 'email firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Landing_model_1.default.countDocuments(query)
        ]);
        res.json({
            success: true,
            landings,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching landings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch landings'
        });
    }
});
// GET /api/landings/:id - Получить один лендинг по ID (для админки)
router.get('/admin/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const landingDoc = await Landing_model_1.default.findById(req.params.id)
            .populate('createdBy', 'email firstName lastName')
            .populate('marathonsSection.basic.marathonId')
            .populate('marathonsSection.advanced.marathonId');
        if (!landingDoc) {
            return res.status(404).json({
                success: false,
                error: 'Landing not found'
            });
        }
        // Используем toObject чтобы получить все поля включая динамические
        const landing = landingDoc.toObject({ flattenMaps: true, virtuals: false });
        // Проверяем какие кастомные поля есть
        const customFieldsKeys = Object.keys(landing).filter(k => /Section_\d+$/.test(k));
        console.log('📤 Loading landing, custom fields found:', customFieldsKeys);
        res.json({ success: true, landing });
    }
    catch (error) {
        console.error('Error fetching landing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch landing'
        });
    }
});
// POST /api/landings - Создать новый лендинг
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const landingData = {
            ...req.body,
            createdBy: req.userId
        };
        const landing = new Landing_model_1.default(landingData);
        await landing.save();
        res.status(201).json({
            success: true,
            landing,
            message: 'Landing created successfully'
        });
    }
    catch (error) {
        console.error('Error creating landing:', error);
        // Проверка на дубликат slug
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Landing with this slug already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create landing'
        });
    }
});
// PUT /api/landings/:id - Обновить лендинг
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Логируем что пришло с фронта
        const customFieldsKeys = Object.keys(req.body).filter(k => /Section_\d+$/.test(k));
        console.log('📥 Updating landing, custom fields:', customFieldsKeys);
        // Не позволяем изменить createdBy
        delete req.body.createdBy;
        const landing = await Landing_model_1.default.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!landing) {
            return res.status(404).json({
                success: false,
                error: 'Landing not found'
            });
        }
        // Проверяем что сохранилось
        const savedDoc = await Landing_model_1.default.findById(id).lean();
        const savedCustomFields = Object.keys(savedDoc || {}).filter(k => /Section_\d+$/.test(k));
        console.log('📤 Saved landing, custom fields:', savedCustomFields);
        res.json({
            success: true,
            landing,
            message: 'Landing updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error updating landing:', error);
        // Детальная обработка ValidationError от Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message,
                value: error.errors[key].value
            }));
            console.error('🚨 Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors,
                message: `Ошибка валидации: ${validationErrors.map(e => `${e.field} - ${e.message}`).join('; ')}`
            });
        }
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            return res.status(400).json({
                success: false,
                error: 'Duplicate key error',
                details: { field: duplicateField, value: error.keyValue },
                message: `Лендинг с таким ${duplicateField} уже существует`
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update landing',
            message: error.message || 'Неизвестная ошибка при сохранении',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
// PATCH /api/landings/:id/publish - Опубликовать/снять с публикации
router.patch('/:id/publish', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;
        const landing = await Landing_model_1.default.findByIdAndUpdate(id, {
            isPublished,
            publishedAt: isPublished ? new Date() : undefined
        }, { new: true });
        if (!landing) {
            return res.status(404).json({
                success: false,
                error: 'Landing not found'
            });
        }
        res.json({
            success: true,
            landing,
            message: `Landing ${isPublished ? 'published' : 'unpublished'} successfully`
        });
    }
    catch (error) {
        console.error('Error publishing landing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update landing status'
        });
    }
});
// DELETE /api/landings/:id - Удалить лендинг
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const landing = await Landing_model_1.default.findByIdAndDelete(id);
        if (!landing) {
            return res.status(404).json({
                success: false,
                error: 'Landing not found'
            });
        }
        res.json({
            success: true,
            message: 'Landing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting landing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete landing'
        });
    }
});
// ============ PUBLIC ENDPOINTS ============
// GET /api/landings/public/:slug - Получить опубликованный лендинг по slug
// GET /api/landings/public - Получить список всех опубликованных лендингов (для билда)
router.get('/public', async (req, res) => {
    try {
        const landings = await Landing_model_1.default.find({ isPublished: true })
            .select('slug title')
            .lean();
        res.json({
            success: true,
            landings
        });
    }
    catch (error) {
        console.error('Error fetching public landings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch public landings'
        });
    }
});
router.get('/public/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const landing = await Landing_model_1.default.findOne({
            slug,
            isPublished: true
        })
            .populate('marathonsSection.basic.marathonId', 'title numberOfDays cost tenure courseDescription')
            .populate('marathonsSection.advanced.marathonId', 'title numberOfDays cost tenure courseDescription')
            .lean();
        if (!landing) {
            return res.status(404).json({
                success: false,
                error: 'Landing not found or not published'
            });
        }
        // Увеличиваем счетчик просмотров
        await Landing_model_1.default.findByIdAndUpdate(landing._id, {
            $inc: { views: 1 }
        });
        res.json({ success: true, landing });
    }
    catch (error) {
        console.error('Error fetching public landing:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch landing'
        });
    }
});
// POST /api/landings/public/:slug/conversion - Зафиксировать конверсию
router.post('/public/:slug/conversion', async (req, res) => {
    try {
        const { slug } = req.params;
        await Landing_model_1.default.findOneAndUpdate({ slug, isPublished: true }, { $inc: { conversions: 1 } });
        res.json({ success: true, message: 'Conversion tracked' });
    }
    catch (error) {
        console.error('Error tracking conversion:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track conversion'
        });
    }
});
exports.default = router;
