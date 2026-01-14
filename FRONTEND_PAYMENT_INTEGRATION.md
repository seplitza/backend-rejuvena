# Фронтенд интеграция платежной системы - Готовые компоненты

## 📦 Созданные компоненты

### 1. **PaymentButton.tsx** - Кнопка оплаты
Расположение: `docs/frontend/components/PaymentButton.tsx`

Универсальная кнопка для создания платежа:
```tsx
import PaymentButton from '@/components/PaymentButton';

<PaymentButton 
  amount={990}
  planType="premium"
  duration={30}
  buttonText="Оплатить 990 ₽"
/>
```

### 2. **PremiumPlanCard.tsx** - Карточка премиум плана
Расположение: `docs/frontend/components/PremiumPlanCard.tsx`

Готовая карточка с описанием и кнопкой оплаты:
```tsx
import PremiumPlanCard from '@/components/PremiumPlanCard';

<PremiumPlanCard />
```

### 3. **PaymentSuccess.tsx** - Страница успешной оплаты
Расположение: `docs/frontend/pages/PaymentSuccess.tsx`

Маршрут: `/payment/success`

Функционал:
- ✅ Автоматическая проверка статуса платежа
- ✅ Polling каждые 3 секунды до завершения
- ✅ Показ деталей платежа
- ✅ Переход к упражнениям

### 4. **PaymentFail.tsx** - Страница ошибки оплаты
Расположение: `docs/frontend/pages/PaymentFail.tsx`

Маршрут: `/payment/fail`

Функционал:
- ❌ Отображение причины ошибки
- ❌ Рекомендации для пользователя
- ❌ Кнопки "Попробовать снова" и "Поддержка"

### 5. **PaymentModal.tsx** - Обновленный модал (интегрирован)
Расположение: `docs/frontend/PaymentModal.tsx`

Обновлен для работы с Альфа-Банком вместо localStorage.

## 🚀 Интеграция в ваш проект

### Шаг 1: Скопировать компоненты

```bash
# Скопируйте файлы в ваш проект
cp docs/frontend/components/PaymentButton.tsx src/components/
cp docs/frontend/components/PremiumPlanCard.tsx src/components/
cp docs/frontend/pages/PaymentSuccess.tsx src/pages/payment/success.tsx
cp docs/frontend/pages/PaymentFail.tsx src/pages/payment/fail.tsx
cp docs/frontend/PaymentModal.tsx src/components/
```

### Шаг 2: Настроить роутинг

**Для Next.js:**
```
pages/
  payment/
    success.tsx  <- PaymentSuccess компонент
    fail.tsx     <- PaymentFail компонент
```

**Для React Router:**
```tsx
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';

<Routes>
  <Route path="/payment/success" element={<PaymentSuccess />} />
  <Route path="/payment/fail" element={<PaymentFail />} />
</Routes>
```

### Шаг 3: Убрать заглушку "В разработке"

Найдите компонент с заглушкой и замените на:

```tsx
import PremiumPlanCard from '@/components/PremiumPlanCard';

// Вместо:
// <p>Оплата в разработке</p>

// Используйте:
<PremiumPlanCard />
```

### Шаг 4: Добавить модал на страницу упражнения

```tsx
import { useState } from 'react';
import PaymentModal from '@/components/PaymentModal';

export default function ExercisePage() {
  const [showPayment, setShowPayment] = useState(false);
  const isPremiumExercise = true; // проверка по тегам
  const userHasPremium = false; // проверка isPremium пользователя

  if (isPremiumExercise && !userHasPremium) {
    return (
      <>
        <div className="locked-content">
          <button onClick={() => setShowPayment(true)}>
            Разблокировать упражнение
          </button>
        </div>

        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          exerciseName="Название упражнения"
          price={990}
          isPro={true}
        />
      </>
    );
  }

  return <div>Контент упражнения...</div>;
}
```

## 🔧 Конфигурация

### API Endpoint
Все компоненты используют:
```typescript
const API_URL = 'https://api-rejuvena.duckdns.org';
```

Если нужно изменить, отредактируйте в каждом компоненте или вынесите в `.env`:
```env
NEXT_PUBLIC_API_URL=https://api-rejuvena.duckdns.org
```

### Авторизация
Компоненты ожидают JWT токен в:
```typescript
localStorage.getItem('authToken')
```

Убедитесь, что после логина вы сохраняете токен:
```typescript
localStorage.setItem('authToken', token);
```

## 📱 Тестирование

### Локально:

1. **Запустите фронтенд:**
```bash
npm run dev
```

2. **Войдите в систему** (чтобы получить токен)

3. **Нажмите кнопку "Оплатить"**
   - Будет создан платеж через API
   - Откроется страница Альфа-Банка

4. **Используйте тестовую карту:**
   - Номер: `5555 5555 5555 4444`
   - Срок: любая будущая дата
   - CVV: `123`
   - Имя: `TEST CARDHOLDER`

5. **После оплаты** вернетесь на `/payment/success`
   - Компонент проверит статус
   - Покажет результат

### Production:

После тестирования измените в `.env` бэкенда:
```env
ALFABANK_API_URL=https://payment.alfabank.ru/payment/rest
```

## 🎨 Кастомизация

### Цвета
Все компоненты используют Tailwind CSS с градиентами:
- `from-purple-600 to-pink-600` - основной градиент
- `from-green-500 to-emerald-600` - успех
- `from-red-500 to-rose-600` - ошибка

Измените классы для своего дизайна.

### Тексты
Все тексты hardcoded на русском. Для мультиязычности используйте:
```tsx
import { useTranslation } from 'next-i18next';

const { t } = useTranslation();
<h2>{t('payment.success')}</h2>
```

## ✅ Чеклист интеграции

- [ ] Скопированы все компоненты
- [ ] Настроены роуты `/payment/success` и `/payment/fail`
- [ ] Убрана заглушка "В разработке"
- [ ] Добавлена PremiumPlanCard на нужную страницу
- [ ] Настроен PaymentModal на странице упражнения
- [ ] Проверена авторизация (localStorage.getItem('authToken'))
- [ ] Протестирован полный поток оплаты
- [ ] Проверены все состояния (success, fail, processing)

## 🐛 Troubleshooting

### Ошибка "Authentication required"
- Проверьте что токен сохранен в localStorage
- Проверьте формат: `Bearer ${token}` в заголовках

### Ошибка CORS
- Убедитесь что бэкенд разрешает ваш домен в CORS

### Платеж не создается
- Проверьте логи браузера (Console)
- Проверьте Network tab для запроса к API
- Убедитесь что бэкенд доступен

### Статус не обновляется
- Компонент делает polling каждые 3 секунды
- Проверьте что orderId передается в URL
- Проверьте права доступа к /api/payment/status/:id

## 📚 Дополнительно

- [ALFABANK-DEPLOYMENT.md](../ALFABANK-DEPLOYMENT.md) - статус деплоя бэкенда
- [PAYMENT-TESTING.md](../PAYMENT-TESTING.md) - тестирование API
- [payment-integration-example.tsx](./payment-integration-example.tsx) - дополнительные примеры
