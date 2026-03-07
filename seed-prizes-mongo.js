// Скрипт для создания 12 призов колеса фортуны через MongoDB
// Запуск: mongosh mongodb://localhost:27017/rejuvena seed-prizes-mongo.js

db = db.getSiblingDB('rejuvena');

// Очистим старые призы (если есть)
db.fortunewheelprizes.deleteMany({});

// Создаем 12 призов
const prizes = [
  {
    name: 'Бесплатный доступ к любому из продвинутых курсов на 1 месяц',
    description: 'Получите доступ к любому продвинутому курсу на 30 дней',
    type: 'freeProduct',
    probability: 5,
    icon: '🎓',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Подарок: крем для тела с медным пептидом',
    description: 'Крем для тела с медным пептидом в подарок',
    type: 'freeProduct',
    probability: 8,
    icon: '🎁',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Бесплатное продление модуля «+ на губы и челюсть» на 1 месяц',
    description: 'Продление доступа к модулю на 30 дней',
    type: 'freeProduct',
    probability: 7,
    icon: '💋',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Подарочный набор: сыворотка + крем с медным пептидом',
    description: 'Набор из сыворотки и крема с медным пептидом',
    type: 'freeProduct',
    probability: 6,
    icon: '🎁',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Бесплатное участие в следующем марафоне Сеплица',
    description: 'Участие в следующем марафоне бесплатно',
    type: 'freeProduct',
    probability: 9,
    icon: '🏃',
    validityDays: 60,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Скидка 50% при заказе от 3-х товаров',
    description: 'Скидка 50% на заказ от 3-х товаров',
    type: 'discount',
    value: 50,
    probability: 10,
    icon: '🎯',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Подарок: любая из 3-х сывороток на выбор',
    description: 'Выберите любую сыворотку из трёх',
    type: 'freeProduct',
    probability: 9,
    icon: '💧',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Подарок: любой БАД на выбор',
    description: 'Выберите любую биодобавку',
    type: 'freeProduct',
    probability: 8,
    icon: '💊',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Скидка 30% на любой товар',
    description: 'Скидка 30% на покупку',
    type: 'discount',
    value: 30,
    probability: 12,
    icon: '💰',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Скидка 20% на любой товар',
    description: 'Скидка 20% на покупку',
    type: 'discount',
    value: 20,
    probability: 13,
    icon: '🏷️',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Бесплатная доставка на следующий заказ',
    description: 'Доставка вашего следующего заказа бесплатно',
    type: 'freeShipping',
    probability: 15,
    icon: '📦',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Скидка 10% на любой товар',
    description: 'Скидка 10% на покупку',
    type: 'discount',
    value: 10,
    probability: 8,
    icon: '🎫',
    validityDays: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Вставляем призы
const result = db.fortunewheelprizes.insertMany(prizes);

print('\n✅ Создано призов: ' + result.insertedIds.length);
print('📊 Общая вероятность: ' + prizes.reduce((sum, p) => sum + p.probability, 0) + '%');

// Показываем созданные призы
print('\n🎰 Призы колеса фортуны:');
db.fortunewheelprizes.find({}).forEach(prize => {
  print(`  - ${prize.icon} ${prize.name} (${prize.probability}%)`);
});
