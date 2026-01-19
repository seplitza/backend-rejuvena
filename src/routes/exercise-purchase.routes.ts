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
      expiresAt: { $gt: new Date() } // Еще не истек срок
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Exercise already purchased' });
                                                       ке
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // +1 месяц доступа

    c    c    c    c    c    c    c    c          userId,
      exerciseId,
      exerciseName      exerciseName    xpiresAt
    });
    await purchase.save();

    // Создаем запись в истории платежей (для Последней активн    // Создаем запись в истории п�
,      amount: price,
      statu      statued',
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
      // Подсчитываем все успешные платежи (премиум + упражнения)
      const successfulPayments = await Payment.countDocuments({
        userId,
        status: 'succeeded'
      });

      // Новая дата окончания фотодневника:
      // firstPhotoDiaryUpload + 30 дней (бесплатно) + (30 дней × кол-во платежей)
      const diaryExpiryDate = new Date(user.firstPhotoDiaryUpload);
      diaryExpiryDate.setDate(diaryExpiryDate.getDate() + 30); // Бесплатные 30 дней
      diaryExpiryDate.setDate(diaryExpiryDate.getDate() + (successfulPayments * 30)); // +30 за каждый платеж


     diaryбновляем пользователя (если нужно сохранить это поле)
      // user.photoDiaryExpiresAt = diaryExpiryDate;
      // await user.save();
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
        amount:        amount:        amount:        amount:        amount:        amymen        amount:        amount:        amount:        amount:        amount:        amymen        amount:       tatus(500).json({ error: 'Internal server error' });
  }
});

// Получить список купленных упражнений
router.get('/my-purchases', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const purchases = await ExercisePurchase.find({
      userId,
      expiresAt: { $gt: new Date() } // Только активные поку�      expiresAt: { $gt: new Date() } // Тольк�so      expiresAt: { $gt: nhases.map(      expire         expiresAt:    exerciseId: p.exerc      expiresAt: { $gt: am      expiresAt: { $gt     price: p.price      expiresAt: { $gt: new Date() } //
                                                                               e.                               rror);
    res.s    r(500).json({    res.s    r(500).jsor error' });
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
