import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import ExercisePurchase from '../models/ExercisePurchase.model';
import User from '../models/User.model';

const router = Router();

// Получить список купленных упражнений
router.get('/my-purchases', authMiddleware, async (req: AuthRequest, res: Response) => {
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
router.get('/has-access/:exerciseId', authMiddleware, async (req: AuthRequest, res: Response) => {
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
