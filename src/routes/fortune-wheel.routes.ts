/**
 * Fortune Wheel Routes - Gamification
 * Spin the wheel to win prizes
 */

import express from 'express';
import FortuneWheelPrize from '../models/FortuneWheelPrize.model';
import WheelSpin from '../models/WheelSpin.model';
import User from '../models/User.model';
import { authMiddleware } from '../middleware/authMiddleware';

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
      .select('name description prizeType discountPercent freeProductId probability imageUrl')
      .lean();

    res.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ error: 'Не удалось загрузить призы' });
  }
});

/**
 * GET /api/fortune-wheel/available-spins
 * Get user's available spins (requires auth)
 */
router.get('/available-spins', authMiddleware, async (req, res) => {
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
router.post('/spin', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Check if user has available spins
    if (!user.fortuneWheelSpins || user.fortuneWheelSpins <= 0) {
      return res.status(400).json({ error: 'У вас нет доступных вращений' });
    }

    // Get all active prizes
    const now = new Date();
    const prizes = await FortuneWheelPrize.find({
      isActive: true,
      $or: [
        { validFrom: { $lte: now }, validUntil: { $gte: now } },
        { validFrom: { $lte: now }, validUntil: null },
        { validFrom: null, validUntil: { $gte: now } },
        { validFrom: null, validUntil: null }
      ]
    });

    if (prizes.length === 0) {
      return res.status(400).json({ error: 'В данный момент нет доступных призов' });
    }

    // Weighted random selection
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let random = Math.random() * totalProbability;
    
    let selectedPrize = prizes[0];
    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    // Calculate expiry (default 30 days)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    // Add prize to user's gifts
    if (!user.fortuneWheelGifts) {
      user.fortuneWheelGifts = [];
    }

    const gift: any = {
      prizeId: selectedPrize._id,
      description: selectedPrize.description,
      prizeType: selectedPrize.prizeType,
      expiry,
      used: false
    };

    if (selectedPrize.prizeType === 'discount') {
      gift.discountPercent = selectedPrize.discountPercent;
    } else if (selectedPrize.prizeType === 'freeProduct') {
      gift.freeProductId = selectedPrize.freeProductId;
    }

    user.fortuneWheelGifts.push(gift);

    // Decrease available spins
    user.fortuneWheelSpins -= 1;

    // Increase prize win count
    if (!selectedPrize.timesWon) {
      selectedPrize.timesWon = 0;
    }
    selectedPrize.timesWon += 1;

    await user.save();

    // Save spin history
    const spin = new WheelSpin({
      user: userId,
      prize: selectedPrize._id,
      expiry
    });
    await spin.save();

    // Increment prize usage
    selectedPrize.timesWon += 1;
    await selectedPrize.save();

    res.json({
      prize: {
        _id: selectedPrize._id,
        name: selectedPrize.name,
        description: selectedPrize.description,
        prizeType: selectedPrize.prizeType,
        discountPercent: selectedPrize.discountPercent,
        imageUrl: selectedPrize.imageUrl
      },
      gift: {
        _id: gift._id,
        expiry: gift.expiry
      },
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
router.get('/my-gifts', authMiddleware, async (req, res) => {
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
router.get('/my-history', authMiddleware, async (req, res) => {
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

export default router;
