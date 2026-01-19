import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import ExercisePurchase from '../models/ExercisePurchase.model';
import User from '../models/User.model';
import Payment from '../models/Payment.model';

const router = Router();

// Покупка отдельного упражнения
router.post('/purchase', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { exerciseId, exerciseName, price } = req.body;
    const userId = req.userId;

    if (!exerciseId || !exerciseName || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверка, не куплено ли уже упражнение
    const existingPurchase = await ExercisePurchase.findOne({
      userId,
      exerciseId,
      expiresAt: { $gt: new Date() }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Exercise already purchased' });
    }

    // Создаем запись о покупке
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const purchase = new ExercisePurchase({
      userId,
      exerciseId,
      exerciseName,
      price,
      expiresAt
    });
    await purchase.save();

    // Создаем запись в истории платежей
    const payment = new Payment({
      userId,
      amount: price,
      status: 'succeeded',
      createdAt: new Date(),
      metadata: {
        type: 'exercise',
        exerciseId,
        exerciseName
      }
    });
    await payment.save();

    // Продлеваем активность фотодневника на 1 месяц
    const user = await User.findById(userId);
    if (user && user.firstPhotoDiaryUpload) {
      const successfulPayments = await Payment.countDocuments({
        userId,
        status: 'succeeded'
      });
    }

    res.json({
      success: true,
      purchase: {
        id: purchase._id,
        exerciseId: purchase.exerciseId,
        exerciseName: purchase.exerciseName,
        price: purchase.price,
        purchaseDate: purchase.purchaseDate,
        expiresAt: purchase.expiresAt
      },
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Exercise purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить список купленных упражнений
router.get('/my-purchases', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const purchases = await ExercisePurchase.find({
      userId,
      expiresAt: { $gt: new Date() }
    }).sort({ purchaseDate: -1 });

    res.json({
      purchases: purchases.map(p => ({
        id: p._id,
        exerciseId: p.exerciseId,
        exerciseName: p.exerciseName,
        price: p.price,
        purchaseDate: p.purchaseDate,
        expiresAt: p.expiresAt
      }))
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Проверка доступа к упражнению
router.get('/has-access/:exerciseId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);

    // Если премиум - доступ ко всему
    if (user?.isPremium && user.premiumEndDate && user.premiumEndDate > new Date()) {
      return res.json({ hasAccess: true, reason: 'premium' });
    }

    // Проверяем покупку упражнения
    const purchase = await ExercisePurchase.findOne({
      userId,
      exerciseId,
      expiresAt: { $gt: new Date() }
    });

    if (purchase) {
      return res.json({ hasAccess: true, reason: 'purchased', expiresAt: purchase.expiresAt });
    }

    res.json({ hasAccess: false });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
