/**
 * Fortune Wheel Routes - Gamification
 * Spin the wheel to win prizes
 */

import express, { Response } from 'express';
import FortuneWheelPrize from '../models/FortuneWheelPrize.model';
import FortuneWheelSettings from '../models/FortuneWheelSettings.model';
import WheelSpin from '../models/WheelSpin.model';
import User from '../models/User.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * GET /api/fortune-wheel/prizes
 * Get active prizes (public)
 */
router.get('/prizes', async (req, res) => {
  try {
    const now = new Date();
    const prizes = await FortuneWheelPrize.find({ 
      isActive: true,
      $or: [
        { validFrom: { $lte: now }, validUntil: { $gte: now } },
        { validFrom: { $lte: now }, validUntil: null },
        { validFrom: null, validUntil: { $gte: now } },
        { validFrom: null, validUntil: null }
      ]
    })
      .select('name description type prizeType discountPercent freeProductId probability imageUrl icon value validityDays displayOrder')
      .sort({ displayOrder: 1, _id: 1 }) // ВАЖНО: сортировка по displayOrder для равномерного распределения призов
      .lean();

    res.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ error: 'Не удалось загрузить призы' });
  }
});

/**
 * GET /api/fortune-wheel/status
 * Check if Fortune Wheel is enabled (public)
 */
router.get('/status', async (req, res) => {
  try {
    let settings = await FortuneWheelSettings.findOne();
    
    // Создать настройки если их нет
    if (!settings) {
      settings = await FortuneWheelSettings.create({ isEnabled: true });
    }
    
    res.json({
      isEnabled: settings.isEnabled
    });
  } catch (error) {
    console.error('Error getting status:', error);
    // По умолчанию возвращаем enabled если произошла ошибка
    res.json({ isEnabled: true });
  }
});

/**
 * GET /api/fortune-wheel/available-spins
 * Get user's available spins (requires auth)
 */
router.get('/available-spins', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const user = await User.findById(userId).select('fortuneWheelSpins').lean();
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      availableSpins: user.fortuneWheelSpins || 0
    });
  } catch (error) {
    console.error('Error fetching available spins:', error);
    res.status(500).json({ error: 'Не удалось загрузить количество доступных вращений' });
  }
});

/**
 * POST /api/fortune-wheel/spin
 * Spin the wheel (requires auth)
 */
router.post('/spin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Check if Fortune Wheel is enabled
    let settings = await FortuneWheelSettings.findOne();
    if (!settings) {
      // Create default settings if not exists
      settings = await FortuneWheelSettings.create({ isEnabled: true });
    }
    
    if (!settings.isEnabled) {
      return res.status(403).json({ 
        error: 'Колесо фортуны временно недоступно',
        message: 'Колесо фортуны временно отключено. Пожалуйста, свяжитесь с нами в Telegram: https://t.me/Seplitza_info_bot'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Check if user has available spins
    if (!user.fortuneWheelSpins || user.fortuneWheelSpins <= 0) {
      return res.status(400).json({ error: 'У вас нет доступных вращений' });
    }

    // Get all active prizes - ВАЖНО: та же сортировка что и в GET /prizes
    const now = new Date();
    const prizes = await FortuneWheelPrize.find({
      isActive: true,
      $or: [
        { validFrom: { $lte: now }, validUntil: { $gte: now } },
        { validFrom: { $lte: now }, validUntil: null },
        { validFrom: null, validUntil: { $gte: now } },
        { validFrom: null, validUntil: null }
      ]
    }).sort({ displayOrder: 1, _id: 1 }); // Та же сортировка!

    if (prizes.length === 0) {
      return res.status(400).json({ error: 'В данный момент нет доступных призов' });
    }

    // Weighted random selection
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let random = Math.random() * totalProbability;
    
    let selectedPrize = prizes[0];
    let selectedPrizeIndex = 0;
    for (let i = 0; i < prizes.length; i++) {
      random -= prizes[i].probability;
      if (random <= 0) {
        selectedPrize = prizes[i];
        selectedPrizeIndex = i;
        break;
      }
    }

    // Calculate expiry (default 30 days or validityDays from prize)
    const expiry = new Date();
    const validityDays = selectedPrize.validityDays || 30;
    expiry.setDate(expiry.getDate() + validityDays);

    // 🎰 Special handling for extraSpin prizes
    if (selectedPrize.type === 'extraSpin') {
      const extraSpins = selectedPrize.value || 1;
      user.fortuneWheelSpins += extraSpins;
      console.log(`🎁 User ${userId} won ${extraSpins} extra spins!`);
      
      // Decrease the spin used for this round
      user.fortuneWheelSpins -= 1;
      
      // Increase prize win count
      if (!selectedPrize.timesWon) {
        selectedPrize.timesWon = 0;
      }
      selectedPrize.timesWon += 1;

      await user.save();
      await selectedPrize.save();

      return res.json({
        success: true,
        prize: {
          _id: selectedPrize._id,
          name: selectedPrize.name,
          description: selectedPrize.description,
          type: selectedPrize.type,
          value: selectedPrize.value,
          icon: selectedPrize.icon
        },
        prizeIndex: selectedPrizeIndex, // Индекс для точной синхронизации вращения
        extraSpinsAwarded: extraSpins,
        remainingSpins: user.fortuneWheelSpins,
        message: `Вы выиграли ${extraSpins} дополнительных вращения!`
      });
    }

    // НЕ добавляем приз сразу - только после подтверждения через /confirm-prize
    // Но уменьшаем спин, чтобы нельзя было крутить бесконечно
    user.fortuneWheelSpins -= 1;

    // Increase prize win count
    if (!selectedPrize.timesWon) {
      selectedPrize.timesWon = 0;
    }
    selectedPrize.timesWon += 1;

    await user.save();
    await selectedPrize.save();

    // Save spin history with all prize data
    const spin = new WheelSpin({
      userId: userId,
      prizeId: selectedPrize._id,
      expiryDate: expiry,
      prizeData: {
        name: selectedPrize.name,
        description: selectedPrize.description,
        type: selectedPrize.type,
        value: selectedPrize.type === 'discount' ? selectedPrize.discountPercent : selectedPrize.value,
        discountPercent: selectedPrize.discountPercent,
        productId: selectedPrize.productId
      }
    });
    await spin.save();

    res.json({
      success: true,
      prize: {
        _id: selectedPrize._id,
        name: selectedPrize.name,
        description: selectedPrize.description,
        type: selectedPrize.type,
        value: selectedPrize.value,
        icon: selectedPrize.icon
      },
      prizeIndex: selectedPrizeIndex, // Индекс для точной синхронизации вращения
      remainingSpins: user.fortuneWheelSpins
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(500).json({ error: 'Не удалось крутить колесо' });
  }
});

/**
 * GET /api/fortune-wheel/my-gifts
 * Get user's won gifts (requires auth)
 */
router.get('/my-gifts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const user = await User.findById(userId)
      .select('fortuneWheelGifts')
      .populate('fortuneWheelGifts.prizeId', 'name description imageUrl')
      .populate('fortuneWheelGifts.freeProductId', 'name price images')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Filter out expired and used gifts
    const now = new Date();
    const activeGifts = (user.fortuneWheelGifts || []).filter((gift: any) => 
      !gift.used && (!gift.expiry || new Date(gift.expiry) > now)
    );

    res.json({
      gifts: activeGifts
    });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ error: 'Не удалось загрузить подарки' });
  }
});

/**
 * GET /api/fortune-wheel/my-history
 * Get user's spin history (requires auth)
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [history, total] = await Promise.all([
      WheelSpin.find({ user: userId })
        .populate('prize', 'name description prizeType discountPercent imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      WheelSpin.countDocuments({ user: userId })
    ]);

    res.json({
      history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching spin history:', error);
    res.status(500).json({ error: 'Не удалось загрузить историю вращений' });
  }
});

/**
 * POST /api/fortune-wheel/confirm-prize
 * Confirm/activate won prize (requires auth)
 */
router.post('/confirm-prize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { prizeId } = req.body;
    if (!prizeId) {
      return res.status(400).json({ error: 'Не указан prizeId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Найти последний spin этого пользователя с указанным prizeId
    const lastSpin = await WheelSpin.findOne({
      userId,
      prizeId
    }).sort({ createdAt: -1 });

    if (!lastSpin) {
      return res.status(404).json({ 
        error: 'Приз не найден в истории вращений'
      });
    }

    // Проверить, не добавлен ли уже этот приз
    const alreadyAdded = user.fortuneWheelGifts?.some((g: any) => 
      g.spinId?.toString() === lastSpin._id.toString()
    );

    if (alreadyAdded) {
      return res.status(400).json({ 
        error: 'Этот приз уже активирован'
      });
    }

    // Добавить приз в fortuneWheelGifts
    if (!user.fortuneWheelGifts) {
      user.fortuneWheelGifts = [];
    }

    const prizeData = (lastSpin as any).prizeData || {};
    const gift: any = {
      spinId: lastSpin._id, // Связь с конкретным spin
      prizeId: lastSpin.prizeId,
      name: prizeData.name, // Название приза
      description: prizeData.description,
      type: prizeData.type,
      value: prizeData.value,
      discountPercent: prizeData.discountPercent,
      expiryDate: lastSpin.expiryDate,
      expiry: lastSpin.expiryDate,
      used: false, // Приз НЕ используется сразу после активации
      isUsed: false // Будет помечен как used при реальном использовании (применении в заказе)
    };

    user.fortuneWheelGifts.push(gift);
    
    // ВАЖНО: После активации приза обнуляем все оставшиеся спины
    user.fortuneWheelSpins = 0;
    
    await user.save();

    console.log(`✅ Prize confirmed for user ${userId}: ${prizeId}, spins reset to 0`);

    res.json({ 
      success: true, 
      message: 'Приз успешно активирован',
      prize: gift,
      remainingSpins: 0
    });
  } catch (error) {
    console.error('Error confirming prize:', error);
    res.status(500).json({ error: 'Не удалось активировать приз' });
  }
});

/**
 * GET /api/fortune-wheel/my-prizes
 * Get user's fortune wheel prizes (requires auth)
 */
router.get('/my-prizes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const user = await User.findById(userId)
      .select('fortuneWheelGifts')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Фильтруем и сортируем призы
    const prizes = (user.fortuneWheelGifts || [])
      .filter((gift: any) => gift.type !== 'extraSpin') // Исключаем дополнительные спины
      .map((gift: any) => ({
        _id: gift._id,
        name: gift.name, // Название приза
        type: gift.type,
        description: gift.description,
        value: gift.value,
        discountPercent: gift.discountPercent,
        expiryDate: gift.expiryDate,
        isUsed: gift.isUsed || gift.used || false,
        usedAt: gift.usedAt,
        orderId: gift.orderId,
        prizeId: gift.prizeId,
        createdAt: gift.expiryDate // Используем expiryDate как ориентир для даты получения
      }))
      .sort((a: any, b: any) => {
        // Сначала неиспользованные, потом использованные
        if (a.isUsed !== b.isUsed) return a.isUsed ? 1 : -1;
        // Потом по дате (новые сначала)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    res.json({
      prizes,
      total: prizes.length,
      active: prizes.filter((p: any) => !p.isUsed && new Date(p.expiryDate) > new Date()).length,
      expired: prizes.filter((p: any) => !p.isUsed && new Date(p.expiryDate) <= new Date()).length,
      used: prizes.filter((p: any) => p.isUsed).length
    });
  } catch (error) {
    console.error('Error fetching user prizes:', error);
    res.status(500).json({ error: 'Не удалось загрузить призы' });
  }
});

export default router;
