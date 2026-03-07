// Скрипт для выдачи fortuneWheelSpins всем пользователям
// Запуск: mongosh mongodb://localhost:27017/rejuvena grant-spins.js

db = db.getSiblingDB('rejuvena');

// Обновляем всех пользователей - выдаем 3 вращения колеса
const result = db.users.updateMany(
  {},
  { 
    $set: { 
      fortuneWheelSpins: 3,
      fortuneWheelGifts: []
    } 
  }
);

print('\n✅ Обновлено пользователей: ' + result.modifiedCount);
print('📊 Всего пользователей в базе: ' + db.users.countDocuments());

// Показываем примеры
print('\n🎯 Примеры пользователей с вращениями:');
db.users.find({}, { email: 1, fortuneWheelSpins: 1, _id: 0 }).limit(5).forEach(u => {
  print(`  - ${u.email || 'Guest'}: ${u.fortuneWheelSpins} вращений`);
});
