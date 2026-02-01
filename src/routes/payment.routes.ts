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

    // Получаем email пользователя для отправки чека
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

    // Генерируем уникальный номер заказа
    const orderNumber = `MARATHON-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Сумма в копейках для Альфа-Банка
    const amountInKopecks = Math.round(price * 100);

    const productDescription = `Марафон: ${marathonName}`;

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
    // Находим существующую запись или создаем новую
    let enrollment = await MarathonEnrollment.findOne({ userId, marathonId });

    const paymentObjectId = new (require('mongoose').Types.ObjectId)(paymentId);

    if (enrollment) {
      // Обновляем существующую запись
      enrollment.status = 'active';
      enrollment.isPaid = true;
      enrollment.paymentId = paymentObjectId;
      enrollment.enrolledAt = new Date();
    } else {
      // Создаем новую запись
      enrollment = new MarathonEnrollment({
        userId,
        marathonId,
        status: 'active',
        isPaid: true,
        paymentId: paymentObjectId,
        enrolledAt: new Date()
      });
    }

    await enrollment.save();
    console.log('✅ Marathon activated for user:', userId, { marathonId, paymentId });

    // Send enrollment confirmation email
    try {
      const user = await User.findById(userId);
      const marathon = await Marathon.findById(marathonId);
      
      if (user?.email && marathon) {
        await emailService.sendMarathonEnrollmentEmail(
          user.email,
          marathon.title,
          marathon.startDate,
          true // paid marathon
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

    // Если статус изменен на succeeded, активируем покупку
    if (status === 'succeeded') {
      // Активация упражнения
      if (payment.metadata?.type === 'exercise' && payment.metadata.exerciseId) {
        await activateExercise(
          payment.userId.toString(),
          payment.metadata.exerciseId,
          payment.metadata.exerciseName || 'Упражнение',
          payment.amount / 100
        );
      }
      // Активация премиума
      else if (payment.metadata?.type === 'premium' || payment.metadata?.planType === 'premium') {
        await activatePremium(
          payment.userId.toString(),
          'premium',
          payment.metadata.duration || 30
        );
      }
      // Активация марафона
      else if ((payment.metadata?.type === 'marathon' || payment.metadata?.planType === 'marathon') && payment.metadata.marathonId) {
        await activateMarathon(
          payment.userId.toString(),
          payment.metadata.marathonId,
          payment._id.toString()
        );
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

export default router;
