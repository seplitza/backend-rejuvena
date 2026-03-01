# ПРОБЛЕМА С ЦЕНАМИ - ДИАГНОСТИКА

## Обнаруженная проблема

### В локальной БД:
1. **Payment (обычный)**: `amount: 99000` (копейки) = 990₽
2. **Order (CRM импорт)**: `price: 3000` (рубли) = 3000₽

**Несогласованность**: Payment хранит в КОПЕЙКАХ, Order в РУБЛЯХ!

### В продакшене:
- Показывает цены в 100 раз БОЛЬШЕ чем надо
- Значит: либо умножает на 100, либо не делит на 100 когда надо

## Корневая причина

В `import-crm-orders.ts` (строка 259):
```typescript
price: item.price  // Берет из CSV как есть (4500 рублей)
```

Но MongoDB Payment модель хранит в КОПЕЙКАХ, поэтому должно быть:
```typescript
price: item.price * 100  // Конвертация в копейки (4500 → 450000)
```

### formatMoney в Users.tsx (строка 63-67):
```typescript
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ₽';  // НЕ делит на 100!
};
```

**Правильная версия должна делить на 100:**
```typescript
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100) + ' ₽';  // ДЕЛИТ на 100
};
```

## Решение

1. ✅ Исправить formatMoney - делить на 100 (копейки → рубли)
2. ✅ Исправить import-crm-orders.ts - умножать на 100 при импорте
3. ✅ Обновить уже импортированные CRM заказы в БД

## Примеры:

### До исправления:
- БД Order: `price: 3000` (рубли)
- formatMoney: `3000₽` ✅ Правильно

- БД Payment: `amount: 99000` (копейки)
- formatMoney: `99000₽` ❌ Неправильно! Должно быть 990₽

### После исправления:
- БД Order: `price: 450000` (копейки) ← импорт умножит на 100
- formatMoney: `450000 / 100 = 4500₽` ✅ Правильно

- БД Payment: `amount: 99000` (копейки)
- formatMoney: `99000 / 100 = 990₽` ✅ Правильно
