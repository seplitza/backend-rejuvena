# Система импорта данных CRM

## Обзор

Универсальная система импорта данных из CSV и JSON файлов в CRM систему Rejuvena. Основана на опыте нескольких итераций ручных импортов и автоматизирует процесс миграции данных из различных источников.

## Возможности

- ✅ **Универсальный парсер**: Автоматическое определение формата CSV (разделители `;`, `,`, `\t`)
- ✅ **Поддержка JSON**: Импорт из JSON массивов и объектов
- ✅ **Автоопределение типа данных**: orders, payments, users
- ✅ **Сопоставление полей**: Автоматическое преобразование русских заголовков в английские
- ✅ **Предпросмотр**: Просмотр первых 10 записей перед импортом
- ✅ **Режимы импорта**: insert (только новые), upsert (обновление), replace (замена всех)
- ✅ **Обработка ошибок**: Детальные отчеты об ошибках с указанием проблемных записей
- ✅ **История импорта**: Логирование всех операций импорта

## Архитектура

### Backend: `/src/routes/data-import.routes.ts`

```typescript
class DataImportParser {
  // Парсинг CSV с автоопределением разделителя
  static parseCSV(content: string): any[]
  
  // Парсинг JSON (массивы и объекты)
  static parseJSON(content: string): any[]
  
  // Определение типа данных по названиям полей
  static detectDataType(data: any[]): 'orders' | 'payments' | 'users' | 'unknown'
  
  // Нормализация полей (русский → английский)
  static normalizeFields(data: any[], type: string): any[]
}
```

### API Endpoints

#### 1. Предпросмотр данных
```
POST /api/admin/data-import/preview
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>

Body: { file: <uploaded-file> }

Response: {
  success: true,
  data: {
    preview: [...],        // Первые 10 записей
    totalRecords: 150,     // Общее количество
    detectedType: "orders", // Определенный тип
    fields: [...]          // Обнаруженные поля
  }
}
```

#### 2. Выполнение импорта
```
POST /api/admin/data-import/execute
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>

Body: { 
  file: <uploaded-file>,
  mode: "upsert",          // insert | upsert | replace
  dataType: "orders"       // orders | payments | users
}

Response: {
  success: true,
  data: {
    imported: 145,
    skipped: 3,
    errors: 2,
    errorDetails: [
      {
        record: {...},
        error: "Duplicate order number"
      }
    ]
  }
}
```

#### 3. История импорта
```
GET /api/admin/data-import/history
Authorization: Bearer <admin-token>

Response: {
  success: true,
  data: {
    history: [
      {
        timestamp: "2024-01-15T10:30:00Z",
        dataType: "orders",
        totalRecords: 150,
        imported: 145,
        skipped: 3,
        errors: 2
      }
    ],
    totalImports: 1,
    totalRecordsImported: 145
  }
}
```

### Frontend: `/admin-panel/src/pages/DataImport.tsx`

React компонент с drag-and-drop интерфейсом:

- Загрузка файлов (перетаскивание или выбор)
- Таблица предпросмотра данных
- Выбор режима импорта
- Отображение результатов
- История всех импортов

## Сопоставление полей

### Orders (Заказы)

| Русское название | Английское поле | Тип |
|-----------------|----------------|-----|
| Номер заказа | orderNumber | string |
| ФИО | fullName | string |
| Email | email | string |
| Телефон | phone | string |
| Товары в заказе | items | array |
| Сумма заказа | totalAmount | number (копейки) |
| Скидка | discount | number (копейки) |
| Стоимость доставки | shippingCost | number (копейки) |
| Статус заказа | status | string |
| Статус оплаты | paymentStatus | string |
| Дата создания | createdAt | date |
| Адрес доставки | shippingAddress | string |

### Payments (Платежи)

| Русское название | Английское поле | Тип |
|-----------------|----------------|-----|
| Email пользователя | userEmail | string |
| Сумма платежа | amount | number (копейки) |
| Статус платежа | status | string |
| Дата платежа | paymentDate | date |
| ID транзакции | transactionId | string |
| Способ оплаты | paymentMethod | string |
| Описание | description | string |

### Users (Пользователи)

| Русское название | Английское поле | Тип |
|-----------------|----------------|-----|
| Email | email | string |
| Имя | firstName | string |
| Фамилия | lastName | string |
| Telegram | telegramUsername | string |
| Премиум статус | isPremium | boolean |
| Дата окончания премиума | premiumEndDate | date |

## Форматы файлов

### CSV Format

**Поддерживаемые разделители:**
- `;` (русский Excel)
- `,` (стандарт CSV)
- `\t` (табуляция)

**Пример заказов (orders.csv):**
```csv
Номер заказа;ФИО;Email;Телефон;Товары в заказе;Сумма заказа;Статус заказа;Статус оплаты
CRM-001;Иванова Мария;maria@example.com;+79001234567;"Крем для лица (1x1500₽)";1500₽;shipped;paid
CRM-002;Петров Сергей;sergey@example.com;+79007654321;"Сыворотка (2x2500₽)";5000₽;processing;pending
```

**Пример платежей (payments.csv):**
```csv
Email пользователя,Сумма платежа,Статус платежа,Дата платежа,Способ оплаты
user@example.com,990,success,2024-01-15,card
user2@example.com,1990,success,2024-01-16,sbp
```

### JSON Format

**Массив объектов:**
```json
[
  {
    "orderNumber": "CRM-001",
    "fullName": "Иванова Мария",
    "email": "maria@example.com",
    "phone": "+79001234567",
    "items": [
      {
        "productName": "Крем для лица",
        "quantity": 1,
        "price": 150000
      }
    ],
    "totalAmount": 150000,
    "status": "shipped",
    "paymentStatus": "paid"
  }
]
```

**Объект с массивом:**
```json
{
  "orders": [
    {...},
    {...}
  ]
}
```

## Режимы импорта

### INSERT (Только новые)
- Вставляет только новые записи
- Пропускает существующие (по email, orderNumber и т.д.)
- **Использование**: Добавление новых пользователей без влияния на существующих

### UPSERT (Обновление + вставка) ⭐ Рекомендуется
- Обновляет существующие записи
- Вставляет новые
- **Использование**: Синхронизация данных CRM с актуализацией информации

### REPLACE (Полная замена) ⚠️ Опасно
- Удаляет все существующие записи типа
- Вставляет новые данные
- **Использование**: Полная миграция с нуля (требует подтверждения)

## Важно: Цены в копейках

**ВСЕ суммы должны храниться в копейках (умножены на 100):**

```javascript
// ❌ НЕПРАВИЛЬНО
totalAmount: 1500  // 1500 рублей

// ✅ ПРАВИЛЬНО
totalAmount: 150000  // 1500 рублей = 150000 копеек
```

**Автоматическая конвертация:**
- Если в CSV цены указаны как "1500₽", парсер автоматически преобразует в 150000 копеек
- Если цены уже в копейках (числа > 10000), конвертация не применяется

## Примеры использования

### 1. Импорт заказов из Excel

1. Экспортируйте данные из Excel в CSV (разделитель `;`)
2. Откройте админ-панель → Импорт данных
3. Перетащите CSV файл в зону загрузки
4. Нажмите "Предпросмотр"
5. Проверьте первые 10 записей
6. Выберите режим "upsert"
7. Нажмите "Импортировать"

### 2. Миграция платежей из старой системы

```bash
# Пример структуры JSON
{
  "payments": [
    {
      "userEmail": "user@example.com",
      "amount": 99000,  # 990₽ в копейках
      "status": "success",
      "paymentDate": "2024-01-15T10:30:00Z",
      "transactionId": "TXN-12345"
    }
  ]
}
```

### 3. Добавление новых пользователей

```csv
Email,Имя,Фамилия,Telegram
user1@example.com,Анна,Смирнова,@anna_s
user2@example.com,Петр,Иванов,@petr_i
```

## Обработка ошибок

### Типичные ошибки и решения

**1. "No face detected" или проблемы с полями:**
```
Ошибка: Required field 'email' is missing
Решение: Убедитесь, что в CSV есть столбец "Email" или "email"
```

**2. "Duplicate entry":**
```
Ошибка: Order CRM-123 already exists
Решение: Используйте режим "upsert" вместо "insert"
```

**3. "Invalid date format":**
```
Ошибка: Cannot parse date '15.01.2024'
Решение: Используйте ISO формат: 2024-01-15 или 2024-01-15T10:30:00Z
```

**4. "Price format error":**
```
Ошибка: Cannot parse price '1,500.00'
Решение: Используйте точку как разделитель: 1500.00
```

## Расширение системы

### Добавление нового типа данных

1. Обновите `detectDataType()` в `data-import.routes.ts`:
```typescript
static detectDataType(data: any[]): string {
  const firstRow = data[0];
  
  // Добавьте условие для нового типа
  if ('productSku' in firstRow && 'stockQuantity' in firstRow) {
    return 'inventory';
  }
  
  // ... остальные условия
}
```

2. Добавьте маппинг полей в `normalizeFields()`:
```typescript
case 'inventory':
  fieldMap = {
    'Артикул': 'sku',
    'Название товара': 'productName',
    'Количество на складе': 'stockQuantity'
  };
  break;
```

3. Создайте обработчик импорта:
```typescript
case 'inventory':
  for (const item of normalizedData) {
    await Inventory.updateOne(
      { sku: item.sku },
      { $set: item },
      { upsert: mode === 'upsert' }
    );
  }
  break;
```

## Миграция на продакшн

### 1. Миграция цен в копейки (КРИТИЧНО!)

```bash
# На production сервере
ssh root@37.252.20.170
cd /var/www/rejuvena-backend
npx ts-node src/scripts/migrate-prices-to-kopeks.ts
```

**Что делает скрипт:**
- Конвертирует все суммы в заказах × 100
- Конвертирует все суммы в платежах × 100
- Пропускает уже мигрированные записи (total > 100000)

### 2. Деплой новой версии

```bash
# Local
git add .
git commit -m "feat: Add universal data import system"
git push origin main

# Production будет обновлен через GitHub Actions
```

### 3. Проверка после деплоя

1. Откройте админ-панель: https://api.seplitza.ru/admin/data-import
2. Попробуйте загрузить тестовый файл
3. Проверьте отображение цен в разделе "Заказы магазина"

## История разработки

Система основана на опыте из следующих скриптов:

- `import-crm-orders.ts` - Импорт заказов из CRM (парсинг товаров, конвертация цен)
- `import-course-payments.ts` - Импорт платежей за курсы (обработка статусов)
- `migrate-prices-to-kopeks.ts` - Миграция существующих данных в копейки

**Ключевые уроки:**
- CSV в России часто использует `;` как разделитель
- Цены могут быть в разных форматах: "1 500₽", "1500.00", "1,500"
- Русские заголовки нужно нормализовать
- UPSERT критичен для продакшена (нельзя удалять пользователей)
- Предпросмотр обязателен перед импортом

## Поддержка

**Если парсер не распознает формат:**

1. Отправьте первые 5 строк файла в техподдержку
2. Опишите структуру данных
3. Разработчик добавит маппинг в `normalizeFields()`

**Пример тикета:**
```
Тема: Добавить поддержку CSV от 1C

Формат файла:
Док_номер;Клиент;Сумма_руб
ОРД-001;ООО "Компания";15000

Ожидаемый результат:
orderNumber: ОРД-001
fullName: ООО "Компания"
totalAmount: 1500000 (копейки)
```

## Лицензия

Часть CRM системы Rejuvena. Только для внутреннего использования.
