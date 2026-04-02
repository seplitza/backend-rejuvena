import { Router, Request, Response } from 'express';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import ExercisePurchase from '../models/ExercisePurchase.model';
import MarathonEnrollment from '../models/MarathonEnrollment.model';
import Marathon from '../models/Marathon.model';
import alfabankService from '../services/alfabank.service';
import emailService from '../services/email.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const router = Router();

/**
 * Генерация читаемого номера заказа: 00001-010120262033
 */
async function generateOrderNumber(): Promise<string> {
  const paymentCount = await Payment.countDocuments();
  const orderSerial = String(paymentCount + 1).padStart(5, '0');
  const now = new Date();
  const dateTime = [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getFullYear()),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');
  return `${orderSerial}-${dateTime}`;
}

/**
 * Создание платежа
 * POST /api/payment/create
 */
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { amount, description, planType, duration, marathonId, marathonName, type } = req.body;

    // Проверка для марафонов
    if (type === 'marathon' || planType === 'marathon') {
      if (!marathonId || !marathonName) {
        return res.status(400).json({
          error: 'Marathon ID and name are required'
        });
      }
      
      // Получаем марафон для цены
      const Marathon = require('../models/Marathon.model').default;
      const marathon = await Marathon.findById(marathonId);
      if (!marathon) {
        return res.status(404).json({ error: 'Marathon not found' });
      }

      // Получаем email пользователя
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const orderNumber = await generateOrderNumber();
      const amountInKopecks = Math.round(marathon.cost * 100);
      const productDescription = marathon.paymentDescription || `Доступ к фото и видео материалам марафона Сеплица ${marathonName}`;

      const payment = await Payment.create({
        userId,
        orderNumber,
        amount: amountInKopecks,
        currency: '643',
        status: 'pending',
        description: productDescription,
        metadata: {
          type: 'marathon',
          marathonId,
          marathonName
        }
      });

      try {
        const alfaResponse = await alfabankService.registerOrder({
          orderNumber,
          amount: amountInKopecks,
          description: productDescription,
          email: user.email,
          jsonParams: {
            userId,
            type: 'marathon',
            marathonId,
            marathonName
          }
        });

        payment.alfaBankOrderId = alfaResponse.orderId;
        payment.paymentUrl = alfaResponse.formUrl;
        payment.status = 'processing';
        await payment.save();

        return res.status(200).json({
          success: true,
          paymentUrl: payment.paymentUrl
        });
      } catch (alfaError: any) {
        payment.status = 'failed';
        payment.errorMessage = alfaError.message;
        await payment.save();

        return res.status(500).json({
          error: 'Failed to create payment',
          message: alfaError.message
        });
      }
    }

    // Продление практики марафона
    if (type === 'practice_renewal') {
      if (!marathonId) {
        return res.status(400).json({ error: 'Marathon ID is required' });
      }

      const enrollment = await MarathonEnrollment.findOne({ userId, marathonId });
      if (!enrollment || !enrollment.isPaid) {
        return res.status(403).json({ error: 'Active marathon enrollment required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Используем переданную сумму или дефолтную 1500 рублей
      const PRACTICE_RENEWAL_PRICE = amount ? Math.round(amount * 100) : 150000; // в копейках
      const orderNumber = await generateOrderNumber();
      const productDescription = description || 'Продление курса практики марафона на 30 дней';

      const payment = await Payment.create({
        userId,
        orderNumber,
        amount: PRACTICE_RENEWAL_PRICE,
        currency: '643',
        status: 'pending',
        description: productDescription,
        metadata: {
          type: 'practice_renewal',
          marathonId
        }
      });

      try {
        const alfaResponse = await alfabankService.registerOrder({
          orderNumber,
          amount: PRACTICE_RENEWAL_PRICE,
          description: productDescription,
          email: user.email,
          jsonParams: {
            userId,
            type: 'practice_renewal',
            marathonId
          }
        });

        payment.alfaBankOrderId = alfaResponse.orderId;
        payment.paymentUrl = alfaResponse.formUrl;
        payment.status = 'processing';
        await payment.save();

        return res.status(200).json({
          success: true,
          paymentUrl: payment.paymentUrl
        });
      } catch (alfaError: any) {
        payment.status = 'failed';
        payment.errorMessage = alfaError.message;
        await payment.save();

        return res.status(500).json({
          error: 'Failed to create payment',
          message: alfaError.message
        });
      }
    }

    // Обычная обработка для premium/photo-diary
    if (!amount || !description) {
      return res.status(400).json({
        error: 'Amount and description are required'
      });
    }

    // Получаем email пользователя для отправки чека
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Генерируем уникальный номер заказа в формате: 00001-датаВремя
    const orderNumber = await generateOrderNumber();

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
        email: user.email, // Отправляем email для чека
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

    // Получаем email пользователя для отправки чека
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    const orderNumber = await generateOrderNumber();

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
        email: user.email, // Отправляем email для чека
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
 * Создание платежа для покупки марафона
 * POST /api/payment/create-marathon
 */
router.post('/create-marathon', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { marathonId, marathonName, price } = req.body;

    if (!marathonId || !marathonName || !price) {
      return res.status(400).json({
        error: 'Marathon ID, name and price are required'
      });
    }

    // Получаем email пользователя для отправки чека
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Загружаем марафон для получения paymentDescription
    const marathon = await Marathon.findById(marathonId);
    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    // Генерируем уникальный номер заказа
    const orderNumber = await generateOrderNumber();

    // Сумма в копейках для Альфа-Банка
    const amountInKopecks = Math.round(price * 100);

    const productDescription = marathon.paymentDescription || `Доступ к фото и видео материалам марафона Сеплица ${marathonName}`;

    // Создаем запись о платеже в БД
    const payment = await Payment.create({
      userId,
      orderNumber,
      amount: amountInKopecks,
      currency: '643',
      status: 'pending',
      description: productDescription,
      metadata: {
        type: 'marathon',
        marathonId,
        marathonName
      }
    });

    // Регистрируем заказ в Альфа-Банке
    try {
      const alfaResponse = await alfabankService.registerOrder({
        orderNumber,
        amount: amountInKopecks,
        description: productDescription,
        email: user.email, // Отправляем email для чека
        jsonParams: {
          userId,
          type: 'marathon',
          marathonId,
          marathonName
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
    console.error('Create marathon payment error:', error);
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
 * Публичная проверка статуса платежа (без авторизации)
 * GET /api/payment/status-public/:orderId
 * Используется на странице success после редиректа с Альфабанка
 */
router.get('/status-public/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Ищем платеж по orderId (alfaBankOrderId)
    let payment = await Payment.findOne({ alfaBankOrderId: orderId });

    // Если не нашли, пробуем найти по orderNumber (может быть передан вместо orderId)
    if (!payment) {
      payment = await Payment.findById(orderId).catch(() => null);
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Проверяем актуальный статус в Альфа-Банке
    if (payment.alfaBankOrderId) {
      try {
        const alfaStatus = await alfabankService.getOrderStatus(payment.alfaBankOrderId);
        const newStatus = alfabankService.getOrderStatusString(alfaStatus.orderStatus);
        
        // Обновляем статус если изменился
        if (payment.status !== newStatus) {
          payment.status = newStatus as any;
          
          // Если платеж успешен, активируем соответствующий доступ
          if (newStatus === 'succeeded') {
            if (payment.metadata?.type === 'exercise' && payment.metadata.exerciseId && payment.metadata.exerciseName) {
              await activateExercise(
                payment.userId.toString(),
                payment.metadata.exerciseId,
                payment.metadata.exerciseName,
                payment.amount / 100
              );
            } else if (payment.metadata?.type === 'practice_renewal' && payment.metadata.marathonId) {
              await activatePracticeRenewal(
                payment.userId.toString(),
                payment.metadata.marathonId
              );
            } else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && payment.metadata.marathonId) {
              await activateMarathon(
                payment.userId.toString(),
                payment.metadata.marathonId,
                payment._id.toString()
              );
            } else {
              await activatePremium(
                payment.userId.toString(),
                payment.metadata?.planType,
                payment.metadata?.duration
              );
            }
          }
          
          await payment.save();
        }
      } catch (alfaError) {
        console.error('Error checking AlfaBank status (public):', alfaError);
      }
    }

    // Возвращаем только публичную информацию (без userId)
    return res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        orderNumber: payment.orderNumber,
        amount: payment.amount / 100,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        metadata: payment.metadata
      }
    });
  } catch (error: any) {
    console.error('Get payment status (public) error:', error);
    return res.status(500).json({
      success: false,
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
/**
 * Webhook handler logic (extracted for reuse)
 */
async function handleWebhook(req: Request, res: Response) {
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
      } else if (payment.metadata?.type === 'practice_renewal' && payment.metadata.marathonId) {
        await activatePracticeRenewal(
          payment.userId.toString(),
          payment.metadata.marathonId
        );
      } else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && payment.metadata.marathonId) {
        // Покупка марафона
        await activateMarathon(
          payment.userId.toString(),
          payment.metadata.marathonId,
          payment._id.toString()
        );
      } else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && !payment.metadata.marathonId) {
        console.warn('⚠️ Marathon payment without marathonId - manual activation required:', payment._id);
        await activatePremium(
          payment.userId.toString(),
          payment.metadata?.planType,
          payment.metadata?.duration
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
}

/**
 * Webhook endpoint (primary)
 * POST /api/payment/webhook
 */
router.post('/webhook', handleWebhook);

/**
 * Callback/webhook endpoint (Alfabank alias)
 * POST /api/payment/callback
 */
router.post('/callback', handleWebhook);

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
      } else if (payment.metadata?.type === 'practice_renewal' && payment.metadata.marathonId) {
        await activatePracticeRenewal(
          payment.userId.toString(),
          payment.metadata.marathonId
        );
      } else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && payment.metadata.marathonId) {
        // Покупка марафона
        await activateMarathon(
          payment.userId.toString(),
          payment.metadata.marathonId,
          payment._id.toString()
        );
      } else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && !payment.metadata.marathonId) {
        console.warn('⚠️ Marathon payment without marathonId - manual activation required:', payment._id);
        await activatePremium(
          payment.userId.toString(),
          payment.metadata?.planType,
          payment.metadata?.duration
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
 * ВАЖНО: Только для premium подписки, НЕ для покупки упражнений!
 */
async function activatePremium(userId: string, planType?: string, duration?: number) {
  try {
    // Проверяем что это именно премиум подписка
    if (planType !== 'premium') {
      console.log('⚠️ activatePremium called for non-premium planType:', planType, '- skipping');
      return;
    }

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
    console.log('✅ Premium activated for user:', userId, { planType, duration });
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

/**
 * Вспомогательная функция для активации доступа к марафону
 */
async function activateMarathon(userId: string, marathonId: string, paymentId: string) {
  try {
    // Marathon IDs
    const BASIC_MARATHON_ID = '697dde2ce5bf02ef8d04876d'; // Омолодись (3000₽)
    const ADVANCED_MARATHON_ID = '69733e78f22ce2297694b8ad'; // +на губы и челюсть". Продвинутый "Омолодись (6000₽)

    // Находим существующую запись или создаем новую
    let enrollment = await MarathonEnrollment.findOne({ userId, marathonId });

    const paymentObjectId = new (require('mongoose').Types.ObjectId)(paymentId);
    
    // Get marathon details for expiresAt calculation
    const marathon = await Marathon.findById(marathonId);
    if (!marathon) {
      console.error('❌ Marathon not found:', marathonId);
      return;
    }

    if (enrollment) {
      // Обновляем существующую запись
      enrollment.status = 'active';
      enrollment.isPaid = true;
      enrollment.paymentId = paymentObjectId;
      enrollment.enrolledAt = new Date();
    } else {
      // Создаем новую запись с expiresAt
      const expiresAt = new Date(marathon.startDate);
      expiresAt.setDate(expiresAt.getDate() + marathon.tenure);
      
      enrollment = new MarathonEnrollment({
        userId,
        marathonId,
        status: 'active',
        isPaid: true,
        paymentId: paymentObjectId,
        currentDay: 1,
        lastAccessedDay: 0,
        completedDays: [],
        enrolledAt: new Date(),
        expiresAt: expiresAt
      });
    }

    await enrollment.save();
    console.log('✅ Marathon activated for user:', userId, { marathonId, paymentId });

    // BONUS: If user purchased Advanced marathon, also activate Basic marathon
    if (marathonId === ADVANCED_MARATHON_ID) {
      console.log('🎁 User purchased Advanced marathon - also activating Basic marathon');
      
      // Check if user already enrolled in basic marathon
      let basicEnrollment = await MarathonEnrollment.findOne({ 
        userId, 
        marathonId: BASIC_MARATHON_ID 
      });

      const basicMarathon = await Marathon.findById(BASIC_MARATHON_ID);
      if (!basicMarathon) {
        console.error('❌ Basic marathon not found:', BASIC_MARATHON_ID);
      } else {
        if (basicEnrollment) {
          // Update existing enrollment
          basicEnrollment.status = 'active';
          basicEnrollment.isPaid = true;
          basicEnrollment.paymentId = paymentObjectId;
          basicEnrollment.enrolledAt = new Date();
          await basicEnrollment.save();
          console.log('✅ Basic marathon enrollment updated for user:', userId);
        } else {
          // Create new enrollment for basic marathon
          const basicExpiresAt = new Date(basicMarathon.startDate);
          basicExpiresAt.setDate(basicExpiresAt.getDate() + basicMarathon.tenure);
          
          basicEnrollment = new MarathonEnrollment({
            userId,
            marathonId: BASIC_MARATHON_ID,
            status: 'active',
            isPaid: true,
            paymentId: paymentObjectId,
            currentDay: 1,
            lastAccessedDay: 0,
            completedDays: [],
            enrolledAt: new Date(),
            expiresAt: basicExpiresAt
          });
          await basicEnrollment.save();
          console.log('✅ Basic marathon activated as bonus for user:', userId);
        }

        // Send enrollment email for basic marathon
        const user = await User.findById(userId);
        if (user?.email) {
          try {
            await emailService.sendMarathonEnrollmentEmail(
              user.email,
              basicMarathon.title,
              basicMarathon.startDate,
              true, // paid as part of advanced purchase
              basicMarathon.telegramGroupUrl
            );
            console.log('📧 Basic marathon enrollment email sent');
          } catch (emailError) {
            console.error('Failed to send basic marathon enrollment email:', emailError);
          }
        }
      }
    }

    // Extend photo diary by 90 days
    const user = await User.findById(userId);
    if (user) {
      const now = new Date();
      let newPhotoEnd: Date;
      
      if (user.photoDiaryEndDate && user.photoDiaryEndDate > now) {
        // Если фотодневник активен - добавляем 90 дней к существующей дате
        newPhotoEnd = new Date(user.photoDiaryEndDate);
        newPhotoEnd.setDate(newPhotoEnd.getDate() + 90);
      } else {
        // Если фотодневник не активирован или истек - активируем на 90 дней от сейчас
        newPhotoEnd = new Date(now);
        newPhotoEnd.setDate(newPhotoEnd.getDate() + 90);
      }
      
      user.photoDiaryEndDate = newPhotoEnd;
      await user.save();
      console.log('📸 Photo diary extended by 90 days for user:', userId, '| New end date:', newPhotoEnd.toISOString());
    }

    // Send enrollment confirmation email
    try {
      const marathon = await Marathon.findById(marathonId);
      
      if (user?.email && marathon) {
        await emailService.sendMarathonEnrollmentEmail(
          user.email,
          marathon.title,
          marathon.startDate,
          true, // paid marathon
          marathon.telegramGroupUrl
        );
      }
    } catch (emailError) {
      console.error('Failed to send marathon enrollment email:', emailError);
      // Don't fail the enrollment if email fails
    }
  } catch (error) {
    console.error('Error activating marathon:', error);
  }
}

/**
 * Admin: Получить все платежи с информацией о пользователях
 * GET /api/payment/admin/all
 */
router.get('/admin/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка прав администратора
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 50, status, search } = req.query;
    
    // Построение фильтра
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Поиск по orderNumber или email (сначала найдем пользователей)
    let userIds: string[] | undefined;
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase().trim();
      
      // Если это номер заказа
      if (searchLower.startsWith('order-') || searchLower.startsWith('exercise-')) {
        filter.orderNumber = { $regex: searchLower, $options: 'i' };
      } else {
        // Ищем пользователей по email
        const users = await User.find({
          email: { $regex: searchLower, $options: 'i' }
        }).select('_id');
        userIds = users.map(u => u._id.toString());
        
        if (userIds.length > 0) {
          filter.userId = { $in: userIds };
        } else {
          // Если не найдено пользователей, попробуем по номеру заказа
          filter.orderNumber = { $regex: searchLower, $options: 'i' };
        }
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Получаем платежи с популяцией пользователей
    const payments = await Payment.find(filter)
      .populate('userId', 'email firstName lastName isPremium premiumEndDate createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip)
      .lean();

    const total = await Payment.countDocuments(filter);

    // Форматируем ответ
    const formattedPayments = payments.map((p: any) => ({
      id: p._id,
      orderNumber: p.orderNumber,
      amount: p.amount / 100, // Конвертируем копейки в рубли
      status: p.status,
      paymentMethod: p.paymentMethod,
      description: p.description,
      metadata: p.metadata,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: p.userId ? {
        id: p.userId._id,
        email: p.userId.email,
        firstName: p.userId.firstName,
        lastName: p.userId.lastName,
        isPremium: p.userId.isPremium,
        premiumEndDate: p.userId.premiumEndDate,
        registeredAt: p.userId.createdAt
      } : null,
      errorMessage: p.errorMessage,
      errorCode: p.errorCode
    }));

    return res.status(200).json({
      success: true,
      payments: formattedPayments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Admin get all payments error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Admin: Обновить статус платежа
 * PATCH /api/payment/admin/:paymentId/status
 */
router.patch('/admin/:paymentId/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка прав администратора
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { paymentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    ).populate('userId', 'email firstName lastName');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('📝 Admin changed payment status:', {
      paymentId: payment._id,
      orderNumber: payment.orderNumber,
      oldStatus: 'unknown',
      newStatus: status,
      metadata: payment.metadata
    });

    // Если статус изменен на succeeded, активируем покупку
    if (status === 'succeeded') {
      console.log('✅ Status changed to succeeded, checking activation...');
      
      // Extract userId (может быть populate объектом или строкой)
      const userId = (payment.userId as any)?._id 
        ? (payment.userId as any)._id.toString() 
        : payment.userId.toString();
      
      // Активация упражнения
      if (payment.metadata?.type === 'exercise' && payment.metadata.exerciseId && payment.metadata.exerciseName) {
        await activateExercise(
          userId,
          payment.metadata.exerciseId,
          payment.metadata.exerciseName,
          payment.amount / 100
        );
      }
      // Активация премиума
      else if (payment.metadata?.type === 'premium' || payment.metadata?.planType === 'premium') {
        await activatePremium(
          userId,
          'premium',
          payment.metadata.duration || 30
        );
      }
      // Активация продления практики
      else if (payment.metadata?.type === 'practice_renewal' && payment.metadata.marathonId) {
        console.log('🔄 Activating practice renewal:', { userId, marathonId: payment.metadata.marathonId });
        await activatePracticeRenewal(userId, payment.metadata.marathonId);
        console.log('✅ Practice renewal activation completed');
      }
      // Активация марафона
      else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && payment.metadata.marathonId) {
        console.log('🏃 Activating marathon:', {
          userId: userId,
          marathonId: payment.metadata.marathonId,
          paymentId: payment._id.toString()
        });
        await activateMarathon(
          userId,
          payment.metadata.marathonId,
          payment._id.toString()
        );
        console.log('✅ Marathon activation completed');
      }
      // Marathon без marathonId
      else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && !payment.metadata.marathonId) {
        console.warn('⚠️ Marathon payment without marathonId - manual activation required:', payment._id);
      }
    }

    return res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        orderNumber: payment.orderNumber,
        status: payment.status,
        user: (payment as any).userId
      }
    });
  } catch (error: any) {
    console.error('Admin update payment status error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Активация продления практики после успешной оплаты
 */
async function activatePracticeRenewal(userId: string, marathonId: string) {
  try {
    const enrollment = await MarathonEnrollment.findOne({ userId, marathonId });
    if (!enrollment) {
      console.error('❌ Enrollment not found for practice renewal:', { userId, marathonId });
      return;
    }

    enrollment.practiceRenewalCount = (enrollment.practiceRenewalCount || 0) + 1;
    enrollment.practiceStartDate = new Date();
    await enrollment.save();

    console.log('✅ Practice renewal activated:', {
      userId,
      marathonId,
      renewalCount: enrollment.practiceRenewalCount,
      practiceStartDate: enrollment.practiceStartDate
    });
  } catch (error) {
    console.error('❌ Error activating practice renewal:', error);
  }
}

export default router;
