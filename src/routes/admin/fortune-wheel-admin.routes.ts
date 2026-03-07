import { Router, Request, Response } from 'express';
import FortuneWheelPrize from '../../models/FortuneWheelPrize.model';
import Product from '../../models/Product.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = Router();

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
      // 1️⃣ Бесплатный доступ к продвинутому курсу на 1 месяц (редкий приз - 5%)
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

      // 2️⃣ Подарок: крем для тела с медным пептидом (8%)
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

      // 3️⃣ Бесплатное продление модуля «+ на губы и челюсть» (7%)
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

      // 4️⃣ Подарочный набор: сыворотка + крем с медным пептидом (6%)
      {
        name: 'Набор: сыворотка + крем',
        description: 'Подарочный набор: сыворотка + крем с медным пептидом',
        type: 'freeProduct',
        value: 'serum_cream_set',
        probability: 6,
        icon: '/images/prize-set.png',
        validityDays: 30,
        isActive: true
      },

      // 5️⃣ Бесплатное участие в следующем марафоне (9%)
      {
        name: 'Участие в марафоне Сеплица',
        description: 'Бесплатное участие в следующем марафоне от Сеплица',
        type: 'freeProduct',
        value: 'marathon_participation',
        probability: 9,
        icon: '/images/prize-marathon.png',
        validityDays: 60,
        isActive: true
      },

      // 6️⃣ Скидка 50% при заказе от 3-х товаров (10%)
      {
        name: 'Скидка 50% при заказе от 3-х товаров',
        description: 'Скидка 50% при заказе от 3-х товаров в магазине Сеплица',
        type: 'discount',
        value: 50,
        discountPercent: 50,
        probability: 10,
        icon: '/images/prize-discount-50.png',
        validityDays: 14,
        isActive: true
      },

      // 7️⃣ Подарок: любая из 3-х сывороток (9%)
      {
        name: 'Сыворотка на выбор',
        description: 'Подарок: любая из 3-х сывороток из магазина Сеплица',
        type: 'freeProduct',
        value: products[1] ? products[1]._id : 'serum_choice',
        probability: 9,
        icon: products[1]?.images[0] || '/images/prize-serum.png',
        validityDays: 30,
        isActive: true
      },

      // 8️⃣ Подарок: любой БАД (8%)
      {
        name: 'БАД на выбор',
        description: 'Подарок: любой БАД из магазина Сеплица',
        type: 'freeProduct',
        value: products[2] ? products[2]._id : 'supplement_choice',
        probability: 8,
        icon: products[2]?.images[0] || '/images/prize-supplement.png',
        validityDays: 30,
        isActive: true
      },

      // 9️⃣ Скидка 30% (12%)
      {
        name: 'Скидка 30%',
        description: 'Скидка 30% на следующий заказ',
        type: 'discount',
        value: 30,
        discountPercent: 30,
        probability: 12,
        icon: '/images/discount-30.png',
        validityDays: 14,
        isActive: true
      },

      // 🔟 Скидка 20% (13%)
      {
        name: 'Скидка 20%',
        description: 'Скидка 20% на следующий заказ',
        type: 'discount',
        value: 20,
        discountPercent: 20,
        probability: 13,
        icon: '/images/discount-20.png',
        validityDays: 7,
        isActive: true
      },

      // 1️⃣1️⃣ Бесплатная доставка (15%)
      {
        name: 'Бесплатная доставка',
        description: 'Бесплатная доставка на следующий заказ',
        type: 'freeShipping',
        value: 'free_shipping',
        probability: 15,
        icon: '/images/free-shipping.png',
        validityDays: 7,
        isActive: true
      },

      // 1️⃣2️⃣ Скидка 10% (8%)
      {
        name: 'Скидка 10%',
        description: 'Скидка 10% на следующий заказ',
        type: 'discount',
        value: 10,
        discountPercent: 10,
        probability: 8,
        icon: '/images/discount-10.png',
        validityDays: 7,
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

export default router;
