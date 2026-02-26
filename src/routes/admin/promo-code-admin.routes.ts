/**
 * Promo Code Admin Routes - Manage promo codes
 * Requires admin authentication
 */

import express from 'express';
import PromoCode from '../../models/PromoCode.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

/**
 * GET /api/admin/promo-codes
 * Get all promo codes
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;

    const query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [promoCodes, total] = await Promise.all([
      PromoCode.find(query)
        .populate('applicableProducts', 'name sku')
        .populate('applicableCategories', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PromoCode.countDocuments(query)
    ]);

    res.json({
      promoCodes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Не удалось загрузить промокоды' });
  }
});

/**
 * GET /api/admin/promo-codes/:id
 * Get single promo code
 */
router.get('/:id', async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .populate('applicableProducts', 'name sku images price')
      .populate('applicableCategories', 'name slug')
      .lean();

    if (!promoCode) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    res.json(promoCode);
  } catch (error) {
    console.error('Error fetching promo code:', error);
    res.status(500).json({ error: 'Не удалось загрузить промокод' });
  }
});

/**
 * POST /api/admin/promo-codes
 * Create new promo code
 */
router.post('/', async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      freeShipping,
      minOrderAmount,
      usageLimit,
      validUntil,
      applicableProducts,
      applicableCategories,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ 
        error: 'Обязательные поля: код, тип скидки, значение скидки' 
      });
    }

    // Check code uniqueness
    const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return res.status(400).json({ error: 'Промокод с таким кодом уже существует' });
    }

    // Validate discount type
    const validTypes = ['percentage', 'fixed', 'freeShipping'];
    if (!validTypes.includes(discountType)) {
      return res.status(400).json({ error: 'Недопустимый тип скидки' });
    }

    // Create promo code
    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      freeShipping: freeShipping || false,
      minOrderAmount,
      usageLimit,
      validUntil,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      isActive: isActive !== undefined ? isActive : true
    });

    await promoCode.save();

    res.status(201).json({
      promoCode,
      message: 'Промокод успешно создан'
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Не удалось создать промокод' });
  }
});

/**
 * PUT /api/admin/promo-codes/:id
 * Update promo code
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      freeShipping,
      minOrderAmount,
      usageLimit,
      validUntil,
      applicableProducts,
      applicableCategories,
      isActive
    } = req.body;

    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    // Check code uniqueness (if changed)
    if (code && code.toUpperCase() !== promoCode.code) {
      const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
      if (existingPromo) {
        return res.status(400).json({ error: 'Промокод с таким кодом уже существует' });
      }
    }

    // Update fields
    if (code) promoCode.code = code.toUpperCase();
    if (description !== undefined) promoCode.description = description;
    if (discountType) promoCode.discountType = discountType;
    if (discountValue !== undefined) promoCode.discountValue = discountValue;
    if (freeShipping !== undefined) promoCode.freeShipping = freeShipping;
    if (minOrderAmount !== undefined) promoCode.minOrderAmount = minOrderAmount;
    if (usageLimit !== undefined) promoCode.usageLimit = usageLimit;
    if (validUntil !== undefined) promoCode.validUntil = validUntil;
    if (applicableProducts) promoCode.applicableProducts = applicableProducts;
    if (applicableCategories) promoCode.applicableCategories = applicableCategories;
    if (isActive !== undefined) promoCode.isActive = isActive;

    await promoCode.save();

    res.json({
      promoCode,
      message: 'Промокод успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Не удалось обновить промокод' });
  }
});

/**
 * DELETE /api/admin/promo-codes/:id
 * Delete promo code (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    promoCode.isActive = false;
    await promoCode.save();

    res.json({ message: 'Промокод успешно деактивирован' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ error: 'Не удалось удалить промокод' });
  }
});

/**
 * GET /api/admin/promo-codes/:id/stats
 * Get promo code usage statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id).lean();
    if (!promoCode) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    // Get order statistics (requires Order model)
    // For now, return basic stats
    const usagePercent = promoCode.usageLimit 
      ? (promoCode.usedCount / promoCode.usageLimit) * 100 
      : 0;

    const isExpired = promoCode.validUntil 
      ? new Date(promoCode.validUntil) < new Date()
      : false;

    res.json({
      code: promoCode.code,
      usedCount: promoCode.usedCount,
      usageLimit: promoCode.usageLimit,
      usagePercent: Math.round(usagePercent),
      isExpired,
      isActive: promoCode.isActive,
      validUntil: promoCode.validUntil
    });
  } catch (error) {
    console.error('Error fetching promo code stats:', error);
    res.status(500).json({ error: 'Не удалось загрузить статистику промокода' });
  }
});

/**
 * POST /api/admin/promo-codes/generate
 * Generate random promo codes in bulk
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      count = 10,
      prefix = '',
      discountType,
      discountValue,
      freeShipping,
      minOrderAmount,
      usageLimit = 1,
      validUntil,
      description
    } = req.body;

    if (!discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Укажите тип и значение скидки' });
    }

    if (count > 100) {
      return res.status(400).json({ error: 'Максимум 100 промокодов за раз' });
    }

    const generatedCodes = [];

    for (let i = 0; i < count; i++) {
      // Generate random 8-character code
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const code = prefix ? `${prefix}${randomCode}` : randomCode;

      // Check uniqueness
      const exists = await PromoCode.findOne({ code });
      if (exists) {
        i--; // Regenerate if collision
        continue;
      }

      const promoCode = new PromoCode({
        code,
        description: description || `Сгенерированный промокод ${code}`,
        discountType,
        discountValue,
        freeShipping: freeShipping || false,
        minOrderAmount,
        usageLimit,
        validUntil,
        isActive: true
      });

      await promoCode.save();
      generatedCodes.push(code);
    }

    res.status(201).json({
      message: `Сгенерировано промокодов: ${generatedCodes.length}`,
      codes: generatedCodes
    });
  } catch (error) {
    console.error('Error generating promo codes:', error);
    res.status(500).json({ error: 'Не удалось сгенерировать промокоды' });
  }
});

export default router;
