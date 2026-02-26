# Shop - Quick Start Guide

## Описание

Интернет-магазин сопутствующих товаров для Rejuvena с интеграциями:
- 🛒 **E-commerce**: Категории, товары, корзина, заказы
- 📦 **Доставка**: СДЭК (расчет, трекинг, офисы)
- 💰 **Скидки**: Промокоды, персональные скидки, наборы
- 🎡 **Геймификация**: Колесо фортуны с призами
- 📊 **Marketplace Integration**: Сравнение цен с WB/Ozon
- 📱 **Уведомления**: Telegram, VK, WhatsApp, Viber, SMS

## Архитектура

### Backend (этот проект)
```
Backend-rejuvena/
├── src/
│   ├── models/
│   │   ├── Product.model.ts           # Товары с marketplace links
│   │   ├── ProductCategory.model.ts   # Категории (иерархия)
│   │   ├── Order.model.ts             # Заказы с CDEK полями
│   │   ├── PromoCode.model.ts         # Система промокодов
│   │   ├── FortuneWheelPrize.model.ts # Призы колеса
│   │   ├── WheelSpin.model.ts         # История вращений (TTL 30 дней)
│   │   ├── MarketplacePrice.model.ts  # История цен (TTL 30 дней)
│   │   └── User.model.ts              # + shop поля
│   ├── routes/
│   │   ├── shop.routes.ts             # Public Shop API
│   │   ├── fortune-wheel.routes.ts    # Fortune Wheel API
│   │   └── admin/
│   │       ├── product-admin.routes.ts
│   │       ├── order-admin.routes.ts
│   │       ├── promo-code-admin.routes.ts
│   │       └── category-admin.routes.ts
│   ├── services/
│   │   ├── marketplace-parser.service.ts   # WB/Ozon парсинг
│   │   ├── price-comparison.service.ts     # Расчет savings
│   │   ├── cdek.service.ts                 # СДЭК API
│   │   └── notification.service.ts         # Multi-channel уведомления
│   ├── cron-jobs.ts               # Scheduled tasks
│   └── scripts/
│       └── seed-shop.ts           # Тестовые данные
└── SHOP_ENV_SETUP.md              # Настройка интеграций
```

### Frontend (отдельный проект - TODO)
- Next.js 14 + TypeScript + Tailwind CSS
- Будет создан в корне `Rejuvena/shop-frontend/`
- Redux Toolkit для state management
- Интеграция с Alfabank для оплаты (уже настроен)

## Установка

### 1. Install Dependencies

```bash
npm install
```

Будут установлены:
- `node-cron` - cron jobs для парсинга цен
- `axios` - HTTP клиент для API интеграций

### 2. Configure Environment

Скопируйте env переменные из [SHOP_ENV_SETUP.md](./SHOP_ENV_SETUP.md):

```bash
# Minimal для начала (остальное опционально)
MONGODB_URI=mongodb://localhost:27017/rejuvena
JWT_SECRET=your_secret_key

# CDEK (test credentials)
CDEK_API_URL=https://api.edu.cdek.ru/v2
CDEK_CLIENT_ID=your_test_client_id
CDEK_CLIENT_SECRET=your_test_client_secret

# Optional: Telegram, VK, WhatsApp, Viber, SMS
# (см. SHOP_ENV_SETUP.md для подробностей)
```

### 3. Seed Test Data

```bash
npm run seed-shop
```

Создаст:
- 4 категории (Косметика, Витамины, Аксессуары + подкатегория)
- 5 товаров (сыворотка, крем, набор, витамин C, роллер)
- 4 промокода (WELCOME10, FREESHIP, SAVE500, SKINCARE20)
- 7 призов для колеса фортуны
- 3 бесплатных вращения всем пользователям

### 4. Run Server

```bash
npm run dev
```

Сервер запустится на `http://localhost:5000`

## API Endpoints

### Public Shop API

#### Products
```bash
# Get all products
GET /api/shop/products?categoryId=xxx&search=крем&sortBy=price&page=1&limit=20

# Get product details
GET /api/shop/products/:id
```

#### Categories
```bash
# Get all categories (with hierarchy)
GET /api/shop/categories
```

#### Promo Codes
```bash
# Validate promo code
POST /api/shop/validate-promo
{
  "code": "WELCOME10",
  "cartTotal": 5000,
  "productIds": ["prod1", "prod2"]
}
```

#### Checkout
```bash
# Create order (requires auth)
POST /api/shop/checkout
Headers: Authorization: Bearer <token>
{
  "items": [
    { "product": "prod_id", "quantity": 2, "price": 1890 }
  ],
  "shippingAddress": {
    "name": "Иван Петров",
    "phone": "+79991234567",
    "city": "Москва",
    "street": "Ленина",
    "house": "10",
    "flat": "25",
    "postalCode": "105064"
  },
  "deliveryMethod": "cdek",
  "cdekOfficeCode": "MSK123",
  "paymentMethod": "online",
  "promoCode": "WELCOME10",
  "usePersonalDiscount": true
}
```

#### Orders
```bash
# Get my orders
GET /api/shop/orders?page=1&limit=10
Headers: Authorization: Bearer <token>

# Get order details
GET /api/shop/orders/:id
Headers: Authorization: Bearer <token>
```

### Fortune Wheel API

```bash
# Get active prizes
GET /api/fortune-wheel/prizes

# Get available spins (requires auth)
GET /api/fortune-wheel/available-spins
Headers: Authorization: Bearer <token>

# Spin the wheel (requires auth)
POST /api/fortune-wheel/spin
Headers: Authorization: Bearer <token>

# Get my gifts
GET /api/fortune-wheel/my-gifts
Headers: Authorization: Bearer <token>

# Get spin history
GET /api/fortune-wheel/my-history?page=1&limit=20
Headers: Authorization: Bearer <token>
```

### Admin API

Все admin роуты требуют `Authorization: Bearer <admin_token>` и role = `admin` или `superadmin`.

#### Products Admin
```bash
GET    /api/admin/products
GET    /api/admin/products/:id
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/restore
POST   /api/admin/products/bulk-update
GET    /api/admin/products/:id/marketplace-prices?days=30
```

#### Orders Admin
```bash
GET  /api/admin/orders
GET  /api/admin/orders/:id
PUT  /api/admin/orders/:id/status
PUT  /api/admin/orders/:id/payment-status
PUT  /api/admin/orders/:id/cdek
GET  /api/admin/orders/stats/summary?dateFrom=2026-01-01
GET  /api/admin/orders/stats/by-status
POST /api/admin/orders/:id/refund
```

#### Promo Codes Admin
```bash
GET    /api/admin/promo-codes
GET    /api/admin/promo-codes/:id
POST   /api/admin/promo-codes
PUT    /api/admin/promo-codes/:id
DELETE /api/admin/promo-codes/:id
GET    /api/admin/promo-codes/:id/stats
POST   /api/admin/promo-codes/generate
```

#### Categories Admin
```bash
GET    /api/admin/categories
GET    /api/admin/categories/:id
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
POST   /api/admin/categories/:id/restore
PUT    /api/admin/categories/reorder
```

## Cron Jobs

Автоматически запускаются при старте сервера (`src/cron-jobs.ts`):

| Schedule | Task | Description |
|----------|------|-------------|
| `5 * * * *` | Marketplace Price Update | Обновление цен с WB/Ozon каждый час |
| `0 9 * * *` | Price Alerts | Проверка товаров дешевле на маркетплейсах (9:00) |
| `0 3 * * *` | Cleanup Wheel Spins | Удаление старых записей вращений (3:00) |
| `0 4 * * *` | Cleanup Gifts | Удаление истекших подарков (4:00) |
| `0 5 * * *` | Cleanup Discounts | Сброс истекших персональных скидок (5:00) |

## Testing

### 1. Test Products API
```bash
curl http://localhost:5000/api/shop/products
```

Должен вернуть список товаров с marketplace ценами и savings.

### 2. Test Fortune Wheel
```bash
# Get prizes
curl http://localhost:5000/api/fortune-wheel/prizes

# Spin (требует токен)
curl -X POST http://localhost:5000/api/fortune-wheel/spin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Marketplace Parser

Запустить вручную парсинг цен:
```typescript
import marketplaceParser from './src/services/marketplace-parser.service';
await marketplaceParser.updateAllPrices();
```

### 4. Test CDEK Integration

```typescript
import cdekService from './src/services/cdek.service';

// Search offices
const offices = await cdekService.searchOffices('Москва');

// Calculate delivery
const cost = await cdekService.calculateDelivery({
  fromPostalCode: '105064',
  toPostalCode: '101000',
  weight: 500,
  length: 20,
  width: 15,
  height: 10,
  declaredValue: 5000
});
```

## Database Indexes

Важные индексы созданы автоматически:
- `MarketplacePrice`: TTL index (automatically delete after 30 days)
- `WheelSpin`: TTL index (automatically delete after 30 days)
- `Product`: `{ sku: 1 }` unique
- `PromoCode`: `{ code: 1 }` unique

## Next Steps

✅ **Done:**
1. Backend models, routes, services
2. Cron jobs, seed script
3. Documentation

🚧 **TODO:**
1. Frontend (Next.js shop)
2. Админка (интеграция в существующую admin-panel)
3. Payment Integration (Alfabank API already configured)
4. Deploy to production (Timeweb VPS)

## Deployment

См. [DEPLOYMENT.md](./DEPLOYMENT.md) для инструкций по деплою на Timeweb.

**Важно перед деплоем:**
- Настроить production env переменные ([SHOP_ENV_SETUP.md](./SHOP_ENV_SETUP.md))
- Переключить CDEK на production URL
- Настроить CORS для production домена (seplitza.ru)
- Настроить nginx reverse proxy для `/api/shop`

## Support

Вопросы по архитектуре - см. [SHOP_IMPLEMENTATION_PLAN.md](../SHOP_IMPLEMENTATION_PLAN.md) в корне проекта.
