/**
 * Миграция: Конвертация цен в копейки
 * 
 * ПРОБЛЕМА:
 * - Order модель хранила цены в рублях (3000)
 * - Payment модель хранит в копейках (99000)
 * - Несогласованность приводила к неправильному отображению
 * 
 * РЕШЕНИЕ:
 * - Приводим все к единому формату: копейки
 * - Умножаем цены CRM заказов на 100
 * - formatMoney теперь делит на 100
 * 
 * Запуск: npx ts-node src/scripts/migrate-prices-to-kopeks.ts
 */

import mongoose from 'mongoose';
import Order from '../models/Order.model';
import Payment from '../models/Payment.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';

async function migratePrices() {
  try {
    console.log('🔌 Подключение к MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Подключено к MongoDB\n');
    
    // ====== МИГРАЦИЯ ORDERS ======
    console.log('📦 Начинаем миграцию Orders...\n');
    
    // Находим все CRM заказы (которые были импортированы с ценами в рублях)
    const orders = await Order.find({
      orderNumber: /^CRM-/
    });
    
    console.log(`Найдено CRM заказов: ${orders.length}`);
    
    let updatedOrders = 0;
    let skippedOrders = 0;
    
    for (const order of orders) {
      try {
        // Проверяем, не мигрирован ли уже (если total > 100000, скорее всего уже в копейках)
        if (order.total > 100000) {
          console.log(`⏭️  Заказ ${order.orderNumber} уже в копейках (total=${order.total}), пропускаем`);
          skippedOrders++;
          continue;
        }
        
        // Конвертируем цены в копейки
        order.items = order.items.map((item: any) => ({
          ...item,
          price: item.price * 100
        }));
        
        order.subtotal = order.subtotal * 100;
        order.total = order.total * 100;
        order.discount = order.discount * 100;
        order.shippingCost = order.shippingCost * 100;
        
        await order.save();
        updatedOrders++;
        
        console.log(`✅ Заказ ${order.orderNumber}: ${order.total / 100}₽ → ${order.total} копеек`);
        
      } catch (error: any) {
        console.error(`❌ Ошибка при обновлении заказа ${order.orderNumber}:`, error.message);
      }
    }
    
    console.log(`\n📊 Результаты миграции Orders:`);
    console.log(`✅ Обновлено: ${updatedOrders}`);
    console.log(`⏭️  Пропущено: ${skippedOrders}\n`);
    
    // ====== МИГРАЦИЯ COURSE PAYMENTS ======
    console.log('💳 Начинаем миграцию Course Payments...\n');
    
    // Находим все CRM платежи за курсы
    const payments = await Payment.find({
      orderNumber: /^CRM-COURSE-/
    });
    
    console.log(`Найдено CRM платежей: ${payments.length}`);
    
    let updatedPayments = 0;
    let skippedPayments = 0;
    
    for (const payment of payments) {
      try {
        // Проверяем, не мигрирован ли уже (если amount > 100000, скорее всего уже в копейках)
        if (payment.amount > 100000) {
          console.log(`⏭️  Платеж ${payment.orderNumber} уже в копейках (amount=${payment.amount}), пропускаем`);
          skippedPayments++;
          continue;
        }
        
        // Конвертируем в копейки
        const oldAmount = payment.amount;
        payment.amount = payment.amount * 100;
        
        await payment.save();
        updatedPayments++;
        
        console.log(`✅ Платеж ${payment.orderNumber}: ${oldAmount}₽ → ${payment.amount} копеек`);
        
      } catch (error: any) {
        console.error(`❌ Ошибка при обновлении платежа ${payment.orderNumber}:`, error.message);
      }
    }
    
    console.log(`\n📊 Результаты миграции Course Payments:`);
    console.log(`✅ Обновлено: ${updatedPayments}`);
    console.log(`⏭️  Пропущено: ${skippedPayments}\n`);
    
    // ====== ИТОГИ ======
    console.log('🎉 Миграция завершена!');
    console.log(`📦 Orders: ${updatedOrders} обновлено`);
    console.log(`💳 Payments: ${updatedPayments} обновлено`);
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Отключено от MongoDB');
  }
}

// Запуск миграции
migratePrices();
