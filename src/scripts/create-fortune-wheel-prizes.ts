import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FortuneWheelPrize from '../models/FortuneWheelPrize.model';
import Product from '../models/Product.model';

// Load environment variables
dotenv.config();

/**
 * Создание призов для колеса фортуны
 * Запуск: npx ts-node src/scripts/create-fortune-wheel-prizes.ts
 */

async function createFortuneWheelPrizes() {
  try {
    // Подключаемся к БД
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключились к БД:', MONGODB_URI);

    console.log('🎡 Создание призов для колеса фортуны...');

    // Удаляем старые призы
    await FortuneWheelPrize.deleteMany({});
    console.log('✅ Старые призы удалены');

    // Получаем случайные товары для призов
    const products = await Product.find({ isActive: true, stock: { $gt: 0 } })
      .sort({ price: -1 })
      .limit(5);

    const prizes = [
      // 🎁 Бесплатный товар (самый редкий приз - 5%)
      {
        name: products[0] ? `Бесплатно: ${products[0].name}` : 'Бесплатный товар',
        description: 'Вы получите этот товар абсолютно бесплатно!',
        type: 'freeProduct',
        prizeType: 'freeProduct',
        value: products[0] ? products[0]._id : null,
        freeProductId: products[0] ? products[0]._id : null,
        probability: 5,
        icon: products[0]?.images[0] || '/images/gift.png',
        imageUrl: products[0]?.images[0] || '/images/gift.png',
        validityDays: 30,
        isActive: true
      },

      // 💎 Скидка 50% (редкий приз - 10%)
      {
        name: 'Скидка 50%',
        description: 'Скидка 50% на следующий заказ',
        type: 'discount',
        prizeType: 'discount',
        value: 50,
        discountPercent: 50,
        probability: 10,
        icon: '/images/discount-50.png',
        imageUrl: '/images/discount-50.png',
        validityDays: 14,
        isActive: true
      },

      // 🎉 Скидка 30% (средний приз - 15%)
      {
        name: 'Скидка 30%',
        description: 'Скидка 30% на следующий заказ',
        type: 'discount',
        prizeType: 'discount',
        value: 30,
        discountPercent: 30,
        probability: 15,
        icon: '/images/discount-30.png',
        imageUrl: '/images/discount-30.png',
        validityDays: 14,
        isActive: true
      },

      // 🌟 Скидка 20% (частый приз - 20%)
      {
        name: 'Скидка 20%',
        description: 'Скидка 20% на следующий заказ',
        type: 'discount',
        prizeType: 'discount',
        value: 20,
        discountPercent: 20,
        probability: 20,
        icon: '/images/discount-20.png',
        imageUrl: '/images/discount-20.png',
        validityDays: 7,
        isActive: true
      },

      // 📦 Бесплатная доставка (частый приз - 20%)
      {
        name: 'Бесплатная доставка',
        description: 'Бесплатная доставка на следующий заказ',
        type: 'freeShipping',
        prizeType: 'freeShipping',
        value: 'free_shipping',
        probability: 20,
        icon: '/images/free-shipping.png',
        imageUrl: '/images/free-shipping.png',
        validityDays: 7,
        isActive: true
      },

      // 🎁 Скидка 10% (очень частый приз - 25%)
      {
        name: 'Скидка 10%',
        description: 'Скидка 10% на следующий заказ',
        type: 'discount',
        prizeType: 'discount',
        value: 10,
        discountPercent: 10,
        probability: 25,
        icon: '/images/discount-10.png',
        imageUrl: '/images/discount-10.png',
        validityDays: 7,
        isActive: true
      },

      // 😢 Попробуйте еще раз (утешительный приз - 5%)
      {
        name: 'Попробуйте еще раз',
        description: 'К сожалению, в этот раз не повезло. Но мы дарим вам дополнительное вращение!',
        type: 'noWin',
        prizeType: 'noWin',
        value: 'try_again',
        probability: 5,
        icon: '/images/try-again.png',
        imageUrl: '/images/try-again.png',
        isActive: true
      }
    ];

    // Проверяем, что сумма вероятностей = 100%
    const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
    if (totalProbability !== 100) {
      console.error(`❌ Ошибка: сумма вероятностей = ${totalProbability}%, должно быть 100%`);
      process.exit(1);
    }

    // Создаем призы
    const created = await FortuneWheelPrize.insertMany(prizes);
    console.log(`✅ Создано ${created.length} призов`);

    // Показываем статистику
    console.log('\n📊 Распределение вероятностей:');
    created.forEach(prize => {
      console.log(`  ${prize.name}: ${prize.probability}%`);
    });

    console.log('\n🎡 Призы успешно созданы!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка создания призов:', error);
    process.exit(1);
  }
}

// Запускаем
createFortuneWheelPrizes();
