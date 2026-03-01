/**
 * Скрипт для удаления пользователей без ФИО
 * 
 * Удаляет:
 * 1. Пользователей с firstName = "Клиент" и пустым lastName
 * 2. Пользователей с пустыми firstName и lastName
 * 3. Связанные заказы (опционально)
 * 
 * Использование:
 * ts-node scripts/cleanup-invalid-users.ts [--delete-orders]
 */

import mongoose from 'mongoose';
import User from '../src/models/User.model';
import Order from '../src/models/Order.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const deleteOrders = process.argv.includes('--delete-orders');
    
    // Находим пользователей без ФИО
    const invalidUsers = await User.find({
      $or: [
        { firstName: 'Клиент', $or: [{ lastName: '' }, { lastName: { $exists: false } }] },
        { firstName: { $in: ['', null] }, lastName: { $in: ['', null] } },
        { firstName: { $exists: false }, lastName: { $exists: false } }
      ]
    });
    
    console.log(`\n📋 Найдено пользователей без ФИО: ${invalidUsers.length}`);
    
    if (invalidUsers.length === 0) {
      console.log('✅ Нет пользователей для удаления');
      process.exit(0);
    }
    
    // Выводим примеры
    console.log('\n📝 Примеры найденных пользователей:');
    invalidUsers.slice(0, 5).forEach(user => {
      console.log(`  - ${user.firstName || '(пусто)'} ${user.lastName || '(пусто)'} (${user.email})`);
    });
    
    if (invalidUsers.length > 5) {
      console.log(`  ... и еще ${invalidUsers.length - 5}`);
    }
    
    const userIds = invalidUsers.map(u => u._id);
    
    // Находим связанные заказы
    const orders = await Order.find({ userId: { $in: userIds } });
    console.log(`\n📦 Найдено заказов этих пользователей: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\n📝 Примеры заказов:');
      orders.slice(0, 5).forEach(order => {
        console.log(`  - ${order.orderNumber} (${order.total} ₽)`);
      });
      
      if (orders.length > 5) {
        console.log(`  ... и еще ${orders.length - 5}`);
      }
    }
    
    // Подтверждение
    console.log('\n⚠️  ВНИМАНИЕ! Будут удалены:');
    console.log(`   - ${invalidUsers.length} пользователей`);
    if (deleteOrders) {
      console.log(`   - ${orders.length} заказов`);
    } else {
      console.log(`   - Заказы НЕ будут удалены (используйте --delete-orders для удаления)`);
    }
    
    console.log('\n⏳ Начинаю удаление через 3 секунды... (Ctrl+C для отмены)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Удаляем заказы если указан флаг
    if (deleteOrders && orders.length > 0) {
      const deleteOrdersResult = await Order.deleteMany({ userId: { $in: userIds } });
      console.log(`✅ Удалено заказов: ${deleteOrdersResult.deletedCount}`);
    }
    
    // Удаляем пользователей
    const deleteUsersResult = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`✅ Удалено пользователей: ${deleteUsersResult.deletedCount}`);
    
    console.log('\n✨ Очистка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
