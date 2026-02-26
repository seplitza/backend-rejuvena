# Shop Environment Variables Configuration

## Shop Integration Keys

Добавьте следующие переменные в `.env` файл:

### CDEK Delivery

```env
# CDEK API (Test environment)
CDEK_API_URL=https://api.edu.cdek.ru/v2
CDEK_CLIENT_ID=your_test_client_id
CDEK_CLIENT_SECRET=your_test_client_secret
CDEK_WAREHOUSE_POSTAL_CODE=105064

# Production CDEK
# CDEK_API_URL=https://api.cdek.ru/v2
# CDEK_CLIENT_ID=your_production_client_id
# CDEK_CLIENT_SECRET=your_production_client_secret
```

**Как получить:**
1. Зарегистрироваться на https://www.cdek.ru/ru/integration
2. Создать тестовый аккаунт в личном кабинете интеграции
3. Получить Client ID и Client Secret
4. Для продакшена - заключить договор с СДЭК

### Telegram Bot

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

**Как получить:**
1. Открыть диалог с @BotFather в Telegram
2. Отправить `/newbot`
3. Задать имя бота (например, "Seplitza Shop Bot")
4. Задать username (например, `seplitza_shop_bot`)
5. Скопировать token

**Дополнительно:**
- Настроить приветственное сообщение: `/setdescription`
- Добавить команды: `/setcommands`
  ```
  start - Начать работу
  orders - Мои заказы
  help - Помощь
  ```

### VK API

```env
VK_ACCESS_TOKEN=vk1.a.your_access_token_here
VK_GROUP_ID=123456789
```

**Как получить:**
1. Создать сообщество на vk.com
2. Перейти в "Управление" → "Настройки" → "Работа с API"
3. Создать ключ доступа со скрытым разрешением "Сообщения сообщества"
4. Скопировать токен
5. ID сообщества указан в адресной строке (club123456789)

### WhatsApp Business API

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/YOUR_PHONE_ID
WHATSAPP_API_KEY=your_permanent_token
```

**Как получить:**
1. Создать аккаунт WhatsApp Business: https://business.whatsapp.com
2. Зарегистрироваться в Meta for Developers: https://developers.facebook.com
3. Создать приложение → "WhatsApp" → "API Setup"
4. Получить Phone Number ID и Permanent Token
5. Верифицировать бизнес-аккаунт

**Альтернатива (проще):**
- Использовать WhatsApp Business API провайдера:
  - https://chat-api.com
  - https://green-api.com
  - https://wapico.ru

### Viber Bot

```env
VIBER_AUTH_TOKEN=your_viber_auth_token
VIBER_SENDER_NAME=Seplitza
```

**Как получить:**
1. Зарегистрироваться на https://partners.viber.com
2. Создать бота
3. Получить Auth Token
4. Настроить webhook для получения сообщений

### SMS.ru

```env
SMS_RU_API_ID=your_api_id_here
```

**Как получить:**
1. Зарегистрироваться на https://sms.ru
2. Пополнить баланс (тестовые SMS бесплатно)
3. В личном кабинете → "Настройки" → "API" скопировать API ID

**Цены (ориентировочно):**
- SMS по России: ~3-5₽ за сообщение
- Бесплатные тестовые SMS на свой номер

## Marketplace Price Parsing

### Wildberries

Не требует API ключа - используется публичный API.

Endpoint: `https://card.wb.ru/cards/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm={articleWB}`

### Ozon

Публичный API без авторизации (может блокироваться при частых запросах).

**Рекомендация:**
- Использовать rate limiting (2 секунды между запросами в `marketplace-parser.service.ts`)
- При необходимости - зарегистрироваться как продавец на Ozon Seller

## Testing

После настройки всех ключей:

```bash
# 1. Установить зависимости
npm install

# 2. Запустить seed для создания тестовых данных
npm run seed-shop

# 3. Запустить сервер
npm run dev

# 4. Протестировать API endpoints
# GET http://localhost:5000/api/shop/products
# POST http://localhost:5000/api/fortune-wheel/spin (requires auth)
```

## Production Checklist

- [ ] CDEK: Переключить на production URL и получить production credentials
- [ ] Telegram: Создать production бота (отдельный от тестового)
- [ ] VK: Верифицировать сообщество
- [ ] WhatsApp: Верифицировать бизнес-аккаунт
- [ ] Viber: Настроить webhook на production домен
- [ ] SMS.ru: Пополнить баланс для production использования
- [ ] Все токены хранить в `.env` (не коммитить в git!)
- [ ] Настроить rate limiting для WB/Ozon парсинга
- [ ] Настроить мониторинг ошибок интеграций

## Security Notes

⚠️ **ВАЖНО:**
- Никогда не коммитить `.env` файл
- Использовать разные ключи для test/production
- Регулярно ротировать токены
- Настроить IP whitelist где возможно (CDEK, VK)
- Хранить production ключи в безопасном месте (1Password, etc.)
