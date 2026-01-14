# Тестирование Интеграции с Альфа-Банком

## 🧪 Автоматический тест

Запустите тестовый скрипт:

```bash
npx tsx src/scripts/test-payment.ts
```

Скрипт проверит:
- ✅ Создание платежа
- ✅ Получение payment URL от Альфа-Банка
- ✅ Проверку статуса платежа
- ✅ История платежей пользователя

## 🔧 Настройка для тестирования

### 1. Добавьте учетные данные Альфа-Банка в `.env`:

```env
# Alfabank Payment Gateway (TEST)
ALFABANK_USERNAME=your_test_username
ALFABANK_PASSWORD=your_test_password
ALFABANK_API_URL=https://web.rbsuat.com/ab/rest  # Тестовый URL
ALFABANK_RETURN_URL=http://localhost:3000/payment/success
ALFABANK_FAIL_URL=http://localhost:3000/payment/fail
FRONTEND_URL=http://localhost:3000
```

**Важно:** Для тестирования используйте **тестовый URL**: `https://web.rbsuat.com/ab/rest`

### 2. Получите тестовые учетные данные

Обратитесь в Альфа-Банк для получения:
- Тестового логина (userName)
- Тестового пароля (password)
- Доступа к тестовой среде

## 🧪 Тестовые карты Альфа-Банка

Для тестирования используйте тестовые карты:

### Успешная оплата:
- **Номер карты:** 5555 5555 5555 4444
- **Срок действия:** любой будущий месяц/год
- **CVV:** любой 3-значный код
- **Имя держателя:** TEST CARDHOLDER

### Отклоненная оплата:
- **Номер карты:** 5555 5555 5555 5557
- **Срок действия:** любой будущий месяц/год
- **CVV:** любой 3-значный код

## 📡 Ручное тестирование через API

### 1. Авторизация

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rejuvena.ru",
    "password": "admin123"
  }'
```

Сохраните полученный `token`.

### 2. Создание платежа

```bash
curl -X POST http://localhost:5000/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 990,
    "description": "Премиум подписка на 30 дней",
    "planType": "premium",
    "duration": 30
  }'
```

Ответ:
```json
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "orderNumber": "ORDER-1234567890-ABCD1234",
    "amount": 990,
    "paymentUrl": "https://web.rbsuat.com/ab/merchants/payment_ru.html?mdOrder=..."
  }
}
```

### 3. Откройте paymentUrl в браузере

Перейдите по `paymentUrl` и выполните тестовую оплату.

### 4. Проверка статуса платежа

```bash
curl -X GET http://localhost:5000/api/payment/status/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. История платежей

```bash
curl -X GET http://localhost:5000/api/payment/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🌐 Интеграция с фронтендом

### Простой пример React компонента:

```tsx
import React, { useState } from 'react';

function PaymentButton() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: 990,
          description: 'Премиум подписка на 30 дней',
          planType: 'premium',
          duration: 30
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Перенаправляем на страницу оплаты Альфа-Банка
        window.location.href = data.payment.paymentUrl;
      } else {
        alert('Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании платежа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Загрузка...' : 'Оплатить 990 ₽'}
    </button>
  );
}
```

### Страница успешной оплаты (payment/success):

```tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Проверяем статус платежа
    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/payment/status/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        setStatus(data.payment.status);
      } catch (error) {
        console.error('Error checking payment:', error);
        setStatus('error');
      }
    };

    if (orderId) {
      checkPayment();
    }
  }, [orderId]);

  return (
    <div>
      {status === 'succeeded' && (
        <div>
          <h1>✅ Оплата прошла успешно!</h1>
          <p>Премиум доступ активирован</p>
        </div>
      )}
      {status === 'loading' && <p>Проверка статуса оплаты...</p>}
      {status === 'error' && <p>❌ Ошибка при проверке платежа</p>}
    </div>
  );
}
```

## 🔄 Поток оплаты

1. **Пользователь нажимает "Оплатить"** → вызывается `POST /api/payment/create`
2. **Бэкенд создает заказ** в Альфа-Банке → получает `formUrl`
3. **Фронтенд перенаправляет** пользователя на `formUrl` (страница Альфа-Банка)
4. **Пользователь вводит данные карты** и подтверждает оплату
5. **Альфа-Банк перенаправляет** на `returnUrl` (ваш сайт)
6. **Фронтенд проверяет статус** через `GET /api/payment/status/:id`
7. **Бэкенд автоматически активирует** премиум если статус = `succeeded`

## 🔒 Production настройки

Для продакшн используйте:

```env
ALFABANK_API_URL=https://payment.alfabank.ru/payment/rest
ALFABANK_RETURN_URL=https://rejuvena.ru/payment/success
ALFABANK_FAIL_URL=https://rejuvena.ru/payment/fail
FRONTEND_URL=https://rejuvena.ru
```

## 🐛 Отладка

Логи сервера покажут:
- Запросы к Альфа-Банку
- Ответы от Альфа-Банка
- Ошибки при регистрации заказов
- Webhook уведомления

Проверьте логи PM2:
```bash
pm2 logs rejuvena-backend
```

## 📚 Полезные ссылки

- [Документация Альфа-Банк REST API](https://pay.alfabank.ru/ecommerce/instructions/merchantManual/pages/index/rest.html)
- Тестовая среда: https://web.rbsuat.com
- Продакшн: https://payment.alfabank.ru
