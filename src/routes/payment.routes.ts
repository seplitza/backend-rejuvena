import { Router, Request, Response } from 'express';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import ExercisePurchase from '../models/ExercisePurchase.model';
import alfabankService from '../services/alfabank.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const router = Router();

/**
 * Создание платежа
 * POST /api/payment/create
 */
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { amount, description, planType, duration } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        error: 'Amount and description are required'
      });
    }

    // Генерируем уникальный номер заказа
    const orderNumber = `ORDER-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Сумма в копейках для Альфа-Банка
    const amountInKopecks = Math.round(amount * 100);

    // Создаем запись о платеже в БД
    const payment = await Payment.create({
      userId,
      orderNumber,
      amount: amountInKopecks,
      currency: '643',
      status: 'pending',
      description,
      metadata: {
        planType,
        duration
      }
    });

    // Регистрируем заказ в Альфа-Банке
    try {
      const alfaResponse = await alfabankService.registerOrder({
        orderNumber,
        amount: amountInKopecks,
        description,
        jsonParams: {
          userId,
          planType,
          duration
        }
      });

      // Обновляем платеж с данными от Альфа-Банка
      payment.alfaBankOrderId = alfaResponse.orderId;
      payment.paymentUrl = alfaResponse.formUrl;
      payment.status = 'processing';
      await payment.save();

      return res.status(200).json({
        success: true,
        payment: {
          id: payment._id,
          orderNumber: payment.orderNumber,
          amount: amount,
          paymentUrl: payment.paymentUrl
        }
      });
    } catch (alfaError: any) {
      // Ошибка при регистрации в Альфа-Банке
      payment.status = 'failed';
      payment.errorMessage = alfaError.message;
      await payment.save();

      return res.status(500).json({
        error: 'Failed to create payment',
        message: alfaError.message
      });
    }
  } catch (error: any) {
    console.error('Create payment error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Создание платежа для покупки упражнения
 * POST /api/payment/create-exercise
 */
router.post('/create-exercise', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { exerciseId, exerciseName, price } = req.body;

    if (!exerciseId || !exerciseName || !price) {
      return res.status(400).json({
        error: 'Exercise ID, name and price are required'
      });
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

    // Генерируем уникальный номер заказа
    const orderNumber = `EXERCISE-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Сумма в копейках для Альфа-Банка
    const amountInKopecks = Math.round(price * 100);

    // ВАЖНО: добавляем "Фото и видео материалы к" перед названием упражнения
    const productDescription = `Фото и видео материалы к ${exerciseName}`;

    // Создаем запись о платеже в БД
    const payment = await Payment.create({
      userId,
      orderNumber,
      amount: amountInKopecks,
      currency: '643',
      status: 'pending',
      description: productDescription,
      metadata: {
        type: 'exercise',
        exerciseId,
        exerciseName
      }
    });

    // Регистрируем заказ в Альфа-Банке
    try {
      const alfaResponse = await alfabankService.registerOrder({
        orderNumber,
        amount: amountInKopecks,
        description: productDescription,
        jsonParams: {
          userId,
          type: 'exercise',
          exerciseId,
          exerciseName
        }
      });

      // Обновляем платеж с данными от Альфа-Банка
      payment.alfaBankOrderId = alfaResponse.orderId;
      payment.paymentUrl = alfaResponse.formUrl;
      payment.status = 'processing';
      await payment.save();

      return res.status(200).json({
        success: true,
        payment: {
          id: payment._id,
          orderNumber: payment.orderNumber,
          amount: price,
          paymentUrl: payment.paymentUrl
        }
      });
    } catch (alfaError: any) {
      // Ошибка при регистрации в Альфа-Банке
      payment.status = 'failed';
      payment.errorMessage = alfaError.message;
      await payment.save();

      return res.status(500).json({
        error: 'Failed to create payment',
        message: alfaError.message
      });
    }
  } catch (error: any) {
    console.error('Create exercise payment error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Проверка статуса платежа
 * GET /api/payment/status/:paymentId
 */
router.get('/status/:paymentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { paymentId } = req.params;

    // Try to find by MongoDB _id first, then by alfaBankOrderId
    let payment = await Payment.findById(paymentId).catch(() => null);
    if (!payment) {
      payment = await Payment.findOne({ alfaBankOrderId: paymentId });
    }

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    // Проверяем, что платеж принадлежит текущему пользователю
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Если есть alfaBankOrderId, проверяем статус в Альфа-Банке
    if (payment.alfaBankOrderId) {
      try {
        const alfaStatus = await alfabankService.getOrderStatus(payment.alfaBankOrderId);
        
        const newStatus = alfabankService.getOrderStatusString(alfaStatus.orderStatus);
        
        // Обновляем статус, если он изменился
        if (payment.status !== newStatus) {
          payment.status = newStatus as any;
          
          // Если платеж успешен, активируем премиум для пользователя
          if (newStatus === 'succeeded') {
            await activatePremium(userId, payment.metadata?.planType, payment.metadata?.duration);
          }
          
          await payment.save();
        }
      } catch (alfaError) {
        console.error('Error checking AlfaBank status:', alfaError);
      }
    }

    return res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        orderNumber: payment.orderNumber,
        amount: payment.amount / 100,
        status: payment.status,
        description: payment.description,
        paymentUrl: payment.paymentUrl,
        createdAt: payment.createdAt,
        metadata: payment.metadata
      }
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Получение истории платежей пользователя
 * GET /api/payment/history
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Payment.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      payments: payments.map(p => ({
        id: p._id,
        orderNumber: p.orderNumber,
        amount: p.amount / 100,
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
        metadata: p.metadata
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Webhook для получения уведомлений от Альфа-Банка
 * POST /api/payment/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { orderId, orderNumber, status } = req.body;

    console.log('AlfaBank webhook received:', { orderId, orderNumber, status });

    // Находим платеж
    const payment = await Payment.findOne({
      $or: [
        { alfaBankOrderId: orderId },
        { orderNumber: orderNumber }
      ]
    });

    if (!payment) {
      console.error('Payment not found for webhook:', { orderId, orderNumber });
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Проверяем актуальный статус в Альфа-Банке
    const alfaStatus = await alfabankService.getOrderStatus(orderId || payment.alfaBankOrderId!);
    const newStatus = alfabankService.getOrderStatusString(alfaStatus.orderStatus);

    payment.status = newStatus as any;
    await payment.save();

    // Если платеж успешен, активируем премиум
    if (newStatus === 'succeeded') {
      // Проверяем тип покупки
      if (payment.metadata?.type === 'exercise' && payment.metadata.exerciseId && payment.metadata.exerciseName) {
        // Покупка упражнения
        await activateExercise(
          payment.userId.toString(),
          payment.metadata.exerciseId,
          payment.metadata.exerciseName,
          payment.amount / 100
        );
      } else {
        // Покупка премиума
        await activatePremium(
          payment.userId.toString(),
          payment.metadata?.planType,
          payment.metadata?.duration
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Callback URL для возврата пользователя после оплаты
 * GET /api/payment/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?reason=missing_order_id`);
    }

    // Проверяем статус платежа
    const alfaStatus = await alfabankService.getOrderStatus(orderId as string);
    const payment = await Payment.findOne({ alfaBankOrderId: orderId });

    if (!payment) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?reason=payment_not_found`);
    }

    const newStatus = alfabankService.getOrderStatusString(alfaStatus.orderStatus);
    payment.status = newStatus as any;
    await payment.save();

    // Если платеж успешен
    if (newStatus === 'succeeded') {
      // Проверяем тип покупки
      if (payment.metadata?.type === 'exercise' && payment.metadata.exerciseId && payment.metadata.exerciseName) {
        // Покупка упражнения
        await activateExercise(
          payment.userId.toString(),
          payment.metadata.exerciseId,
          payment.metadata.exerciseName,
          payment.amount / 100
        );
      } else {
        // Покупка премиума
        await activatePremium(
          payment.userId.toString(),
          payment.metadata?.planType,
          payment.metadata?.duration
        );
      }
      return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
    }

    // Если платеж не успешен
    return res.redirect(`${process.env.FRONTEND_URL}/payment/error?orderId=${orderId}&status=${newStatus}`);
  } catch (error: any) {
    console.error('Callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/error?reason=internal_error`);
  }
});

/**
 * Вспомогательная функция для активации премиума
 */
async function activatePremium(userId: string, planType?: string, duration?: number) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    // Устанавливаем isPremium в true
    user.isPremium = true;

    // Если указана длительность подписки, устанавливаем дату окончания
    if (duration) {
      const now = new Date();
      const premiumEndDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      user.premiumEndDate = premiumEndDate;
    }

    await user.save();
    console.log('Premium activated for user:', userId, { planType, duration });
  } catch (error) {
    console.error('Error activating premium:', error);
  }
}

/**
 * Вспомогательная функция для активации доступа к упражнению
 */
async function activateExercise(userId: string, exerciseId: string, exerciseName: string, price: number) {
  try {
    // Создаем запись о покупке упражнения
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // +1 месяц доступа

    const purchase = new ExercisePurchase({
      userId,
      exerciseId,
      exerciseName,
      price,
      expiresAt
    });
    await purchase.save();

    console.log('Exercise activated for user:', userId, { exerciseId, exerciseName, price });
  } catch (error) {
    console.error('Error activating exercise:', error);
  }
}

export default router;
