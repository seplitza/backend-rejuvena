import { Router, Request, Response } from 'express';
import FortuneWheelPrize from '../../models/FortuneWheelPrize.model';
import Product from '../../models/Product.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// 🚨 TEMPORARY: Grant spins to test users
router.post('/grant-spins-test-users', async (req: Request, res: Response) => {
  try {
    const User = require('../../models/User.model').default;
    const result = await User.updateMany(
      { email: { $regex: 'test', $options: 'i' } },
      { $set: { fortuneWheelSpins: 5, fortuneWheelGifts: [] } }
    );
    const totalTestUsers = await User.countDocuments({ email: { $regex: 'test', $options: 'i' } });
    res.json({ 
      success: true, 
      message: `✅ Выдано 5 вращений тестовым пользователям`,
      modifiedCount: result.modifiedCount,
      totalTestUsers 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка выдачи spins', details: error.message });
  }
});

// 🎁 Grant spins to specific user by email
router.post('/grant-spins', async (req: Request, res: Response) => {
  try {
    const { email, spins = 5 } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    const User = require('../../models/User.model').default;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ error: `Пользователь с email ${email} не найден` });
    }

    // Добавляем спины (не перезаписываем, а добавляем к существующим)
    user.fortuneWheelSpins = (user.fortuneWheelSpins || 0) + spins;
    await user.save();

    res.json({ 
      success: true, 
      message: `✅ Добавлено ${spins} вращений пользователю ${email}`,
      user: {
        email: user.email,
        firstName: user.firstName,
        totalSpins: user.fortuneWheelSpins
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка выдачи спинов', details: error.message });
  }
});

// 🚨 TEMPORARY: Recreate all prizes with new extraSpin prizes
router.post('/recreate-prizes', async (req: Request, res: Response) => {
  try {
    // Delete old prizes
    const deleted = await FortuneWheelPrize.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} old prizes`);

    // Get products for prizes
    const products = await Product.find({ isActive: true }).sort({ price: -1 }).limit(10);

    const prizes = [
      { name: 'Бесплатный доступ к продвинутому курсу', description: 'Бесплатный доступ к любому из продвинутых курсов на 1 месяц', type: 'freeProduct', value: 'advanced_course_1month', probability: 5, icon: '/images/prize-course.png', validityDays: 30, isActive: true },
      { name: 'Крем для тела с медным пептидом', description: 'Подарок: крем для тела с медным пептидом из магазина Сеплица', type: 'freeProduct', value: products[0] ? products[0]._id : null, probability: 8, icon: products[0]?.images[0] || '/images/prize-cream.png', validityDays: 30, isActive: true },
      { name: 'Продление модуля «+ на губы и челюсть»', description: 'Бесплатное продление продвинутого модуля «+ на губы и челюсть» на 1 месяц', type: 'freeProduct', value: 'lips_jaw_module_extension', probability: 7, icon: '/images/prize-module.png', validityDays: 30, isActive: true },
      { name: 'Набор: сыворотка + крем', description: 'Подарочный набор: сыворотка + крем с медным пептидом', type: 'freeProduct', value: 'serum_cream_set', probability: 5, icon: '/images/prize-set.png', validityDays: 30, isActive: true },
      { name: 'Участие в марафоне Сеплица', description: 'Бесплатное участие в следующем марафоне от Сеплица', type: 'freeProduct', value: 'marathon_participation', probability: 7, icon: '/images/prize-marathon.png', validityDays: 60, isActive: true },
      { name: 'Скидка 50% при заказе от 3-х товаров', description: 'Скидка 50% при заказе от 3-х товаров в магазине Сеплица', type: 'discount', value: 50, discountPercent: 50, probability: 8, icon: '/images/prize-discount-50.png', validityDays: 14, isActive: true },
      { name: 'Сыворотка на выбор', description: 'Подарок: любая из 3-х сывороток из магазина Сеплица', type: 'freeProduct', value: products[1] ? products[1]._id : 'serum_choice', probability: 7, icon: products[1]?.images[0] || '/images/prize-serum.png', validityDays: 30, isActive: true },
      { name: 'БАД на выбор', description: 'Подарок: любой БАД из магазина Сеплица', type: 'freeProduct', value: products[2] ? products[2]._id : 'supplement_choice', probability: 6, icon: products[2]?.images[0] || '/images/prize-supplement.png', validityDays: 30, isActive: true },
      { name: 'Скидка 30%', description: 'Скидка 30% на следующий заказ', type: 'discount', value: 30, discountPercent: 30, probability: 9, icon: '/images/discount-30.png', validityDays: 14, isActive: true },
      { name: 'Скидка 20%', description: 'Скидка 20% на следующий заказ', type: 'discount', value: 20, discountPercent: 20, probability: 8, icon: '/images/discount-20.png', validityDays: 7, isActive: true },
      { name: 'Бесплатная доставка', description: 'Бесплатная доставка на следующий заказ', type: 'freeShipping', value: 'free_shipping', probability: 8, icon: '/images/free-shipping.png', validityDays: 7, isActive: true },
      { name: 'Скидка 10%', description: 'Скидка 10% на следующий заказ', type: 'discount', value: 10, discountPercent: 10, probability: 5, icon: '/images/discount-10.png', validityDays: 7, isActive: true },
      { name: '+1 вращение колеса', description: 'Получите дополнительное вращение колеса фортуны!', type: 'extraSpin', value: 1, probability: 10, icon: '/images/prize-spin-1.png', validityDays: 1, isActive: true },
      { name: '+2 вращения колеса', description: 'Получите 2 дополнительных вращения колеса фортуны!', type: 'extraSpin', value: 2, probability: 5, icon: '/images/prize-spin-2.png', validityDays: 1, isActive: true },
      { name: '+3 вращения колеса', description: 'Получите 3 дополнительных вращения колеса фортуны!', type: 'extraSpin', value: 3, probability: 2, icon: '/images/prize-spin-3.png', validityDays: 1, isActive: true }
    ];

    const created = await FortuneWheelPrize.insertMany(prizes);
    
    res.json({ 
      success: true, 
      message: `✅ Создано ${created.length} новых призов (включая extraSpin)`,
      oldCount: deleted.deletedCount,
      newCount: created.length,
      distribution: created.map((p: any) => ({ name: p.name, type: p.type, probability: p.probability + '%' }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Ошибка пересоздания призов', details: error.message });
  }
});
// 🚨 END TEMPORARY

interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * POST /api/admin/fortune-wheel/seed-prizes
 * Создать начальные призы для колеса фортуны
 * Requires: admin auth
 */
router.post('/seed-prizes', [authMiddleware, adminMiddleware], async (req: Request, res: Response) => {
  try {
    console.log('🎡 Создание призов для колеса фортуны...');

    // Проверяем, есть ли уже призы
    const existingCount = await FortuneWheelPrize.countDocuments({});
    if (existingCount > 0) {
      return res.status(400).json({
        error: 'Призы уже существуют',
        message: `В базе уже есть ${existingCount} призов. Используйте /delete-all-prizes перед созданием новых.`,
        existingCount
      });
    }

    // Получаем товары для призов (сыворотки, кремы, БАДы)
    const products = await Product.find({ isActive: true })
      .sort({ price: -1 })
      .limit(10);

    const prizes = [
      // 1️⃣ Курс (5%)
      {
        name: 'Бесплатный доступ к продвинутому курсу',
        description: 'Бесплатный доступ к любому из продвинутых курсов на 1 месяц',
        type: 'freeProduct',
        value: 'advanced_course_1month',
        probability: 5,
        icon: '/images/prize-course.png',
        validityDays: 30,
        isActive: true
      },

      // 2️⃣ Крем (8%)
      {
        name: 'Крем для тела с медным пептидом',
        description: 'Подарок: крем для тела с медным пептидом из магазина Сеплица',
        type: 'freeProduct',
        value: products[0] ? products[0]._id : null,
        probability: 8,
        icon: products[0]?.images[0] || '/images/prize-cream.png',
        validityDays: 30,
        isActive: true
      },

      // 3️⃣ Модуль (7%)
      {
        name: 'Продление модуля «+ на губы и челюсть»',
        description: 'Бесплатное продление продвинутого модуля «+ на губы и челюсть» на 1 месяц',
        type: 'freeProduct',
        value: 'lips_jaw_module_extension',
        probability: 7,
        icon: '/images/prize-module.png',
        validityDays: 30,
        isActive: true
      },

      // 4️⃣ Набор (5%)
      {
        name: 'Набор: сыворотка + крем',
        description: 'Подарочный набор: сыворотка + крем с медным пептидом',
        type: 'freeProduct',
        value: 'serum_cream_set',
        probability: 5,
        icon: '/images/prize-set.png',
        validityDays: 30,
        isActive: true
      },

      // 5️⃣ Марафон (7%)
      {
        name: 'Участие в марафоне Сеплица',
        description: 'Бесплатное участие в следующем марафоне от Сеплица',
        type: 'freeProduct',
        value: 'marathon_participation',
        probability: 7,
        icon: '/images/prize-marathon.png',
        validityDays: 60,
        isActive: true
      },

      // 6️⃣ Скидка 50% (8%)
      {
        name: 'Скидка 50% при заказе от 3-х товаров',
        description: 'Скидка 50% при заказе от 3-х товаров в магазине Сеплица',
        type: 'discount',
        value: 50,
        discountPercent: 50,
        probability: 8,
        icon: '/images/prize-discount-50.png',
        validityDays: 14,
        isActive: true
      },

      // 7️⃣ Сыворотка (7%)
      {
        name: 'Сыворотка на выбор',
        description: 'Подарок: любая из 3-х сывороток из магазина Сеплица',
        type: 'freeProduct',
        value: products[1] ? products[1]._id : 'serum_choice',
        probability: 7,
        icon: products[1]?.images[0] || '/images/prize-serum.png',
        validityDays: 30,
        isActive: true
      },

      // 8️⃣ БАД (6%)
      {
        name: 'БАД на выбор',
        description: 'Подарок: любой БАД из магазина Сеплица',
        type: 'freeProduct',
        value: products[2] ? products[2]._id : 'supplement_choice',
        probability: 6,
        icon: products[2]?.images[0] || '/images/prize-supplement.png',
        validityDays: 30,
        isActive: true
      },

      // 9️⃣ Скидка 30% (9%)
      {
        name: 'Скидка 30%',
        description: 'Скидка 30% на следующий заказ',
        type: 'discount',
        value: 30,
        discountPercent: 30,
        probability: 9,
        icon: '/images/discount-30.png',
        validityDays: 14,
        isActive: true
      },

      // 🔟 Скидка 20% (8%)
      {
        name: 'Скидка 20%',
        description: 'Скидка 20% на следующий заказ',
        type: 'discount',
        value: 20,
        discountPercent: 20,
        probability: 8,
        icon: '/images/discount-20.png',
        validityDays: 7,
        isActive: true
      },

      // 1️⃣1️⃣ Доставка (8%)
      {
        name: 'Бесплатная доставка',
        description: 'Бесплатная доставка на следующий заказ',
        type: 'freeShipping',
        value: 'free_shipping',
        probability: 8,
        icon: '/images/free-shipping.png',
        validityDays: 7,
        isActive: true
      },

      // 1️⃣2️⃣ Скидка 10% (5%)
      {
        name: 'Скидка 10%',
        description: 'Скидка 10% на следующий заказ',
        type: 'discount',
        value: 10,
        discountPercent: 10,
        probability: 5,
        icon: '/images/discount-10.png',
        validityDays: 7,
        isActive: true
      },

      // 🎁 ПРИЗЫ ДЛЯ ВОВЛЕЧЕНИЯ 🎁

      // 1️⃣3️⃣ +1 вращение (10%)
      {
        name: '+1 вращение колеса',
        description: 'Получите дополнительное вращение колеса фортуны!',
        type: 'extraSpin',
        value: 1,
        probability: 10,
        icon: '/images/prize-spin-1.png',
        validityDays: 1,
        isActive: true
      },

      // 1️⃣4️⃣ +2 вращения (5%)
      {
        name: '+2 вращения колеса',
        description: 'Получите 2 дополнительных вращения колеса фортуны!',
        type: 'extraSpin',
        value: 2,
        probability: 5,
        icon: '/images/prize-spin-2.png',
        validityDays: 1,
        isActive: true
      },

      // 1️⃣5️⃣ +3 вращения (2%)
      {
        name: '+3 вращения колеса',
        description: 'Получите 3 дополнительных вращения колеса фортуны!',
        type: 'extraSpin',
        value: 3,
        probability: 2,
        icon: '/images/prize-spin-3.png',
        validityDays: 1,
        isActive: true
      }
    ];

    // Проверяем, что сумма вероятностей = 100%
    const totalProbability = prizes.reduce((sum: number, p: any) => sum + p.probability, 0);
    if (totalProbability !== 100) {
      return res.status(400).json({
        error: 'Ошибка вероятностей',
        message: `Сумма вероятностей = ${totalProbability}%, должно быть 100%`,
        totalProbability
      });
    }

    // Создаем призы
    const created = await FortuneWheelPrize.insertMany(prizes);

    res.json({
      success: true,
      message: `Создано ${created.length} призов`,
      prizes: created,
      distribution: created.map((p: any) => ({
        name: p.name,
        type: p.type,
        probability: p.probability + '%'
      }))
    });

  } catch (error: any) {
    console.error('Error seeding prizes:', error);
    res.status(500).json({
      error: 'Ошибка создания призов',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/fortune-wheel/delete-all-prizes
 * Удалить все призы (для пересоздания)
 * Requires: admin auth
 */
router.delete('/delete-all-prizes', [authMiddleware, adminMiddleware], async (req: Request, res: Response) => {
  try {
    const result = await FortuneWheelPrize.deleteMany({});
    console.log(`🗑️  Удалено ${result.deletedCount} призов`);

    res.json({
      success: true,
      message: `Удалено ${result.deletedCount} призов`
    });
  } catch (error: any) {
    console.error('Error deleting prizes:', error);
    res.status(500).json({
      error: 'Ошибка удаления призов',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/fortune-wheel/stats
 * Статистика колеса фортуны
 */
router.get('/stats', [authMiddleware, adminMiddleware], async (req: Request, res: Response) => {
  try {
    const prizes = await FortuneWheelPrize.find({}).sort({ probability: -1 });
    const totalProbability = prizes.reduce((sum: number, p: any) => sum + p.probability, 0);

    res.json({
      totalPrizes: prizes.length,
      totalProbability,
      isValid: totalProbability === 100,
      prizes: prizes.map((p: any) => ({
        _id: p._id,
        name: p.name,
        type: p.type,
        probability: p.probability,
        timesWon: p.timesWon || 0,
        isActive: p.isActive
      }))
    });
  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Ошибка получения статистики',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/fortune-wheel/winners
 * Получить список недавних победителей
 */
router.get('/winners', [authMiddleware, adminMiddleware], async (req: Request, res: Response) => {
  try {
    const WheelSpin = require('../../models/WheelSpin.model').default;
    const User = require('../../models/User.model').default;
    
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [winners, total] = await Promise.all([
      WheelSpin.find({})
        .populate('userId', 'firstName lastName email')
        .populate('prizeId', 'name description type value discountPercent icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      WheelSpin.countDocuments({})
    ]);

    res.json({
      winners: winners.map((w: any) => ({
        _id: w._id,
        user: w.userId ? {
          _id: w.userId._id,
          name: `${w.userId.firstName || ''} ${w.userId.lastName || ''}`.trim() || 'Пользователь',
          email: w.userId.email
        } : { name: 'Неизвестный пользователь' },
        prize: w.prizeId ? {
          _id: w.prizeId._id,
          name: w.prizeId.name,
          description: w.prizeId.description,
          type: w.prizeId.type,
          value: w.prizeId.value || w.prizeId.discountPercent,
          icon: w.prizeId.icon
        } : (w.prizeData || { name: 'Приз удален' }),
        isUsed: w.isUsed,
        usedAt: w.usedAt,
        expiryDate: w.expiryDate,
        wonAt: w.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error getting winners:', error);
    res.status(500).json({
      error: 'Ошибка получения победителей',
      message: error.message
    });
  }
});

export default router;
