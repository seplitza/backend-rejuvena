# Настройка Cloudflare прокси для Backend API

## ⚠️ ПРОБЛЕМА
Прямое подключение к серверу `37.252.20.170:9527` (api-rejuvena.duckdns.org) блокируется из некоторых географических регионов.

## ✅ РЕШЕНИЕ
Настроить Cloudflare прокси для backend API через домен `backend.seplitza.ru`.

---

## Шаг 1: Добавление DNS записи в Cloudflare (2 минуты)

1. Войдите в **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Выберите домен **seplitza.ru**
3. Перейдите в раздел **DNS** → **Records**
4. Нажмите **Add record**

### Настройки DNS записи:

- **Type**: `A`
- **Name**: `backend` (или `api-backend` если хотите)
- **IPv4 address**: `37.252.20.170`
- **Proxy status**: ✅ **Proxied** (ОБЯЗАТЕЛЬНО включите оранжевое облако 🟠)
- **TTL**: `Auto`

5. Нажмите **Save**

---

## Шаг 2: Настройка Nginx на сервере (5 минут)

Backend API работает на порту `9527`, но Cloudflare проксирует только порты `80` (HTTP) и `443` (HTTPS).

### 2.1 Подключитесь к серверу:
```bash
ssh root@37.252.20.170
```

### 2.2 Создайте конфигурацию Nginx для backend:

```bash
sudo nano /etc/nginx/sites-available/backend-api
```

Вставьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name backend.seplitza.ru;

    # Логи
    access_log /var/log/nginx/backend-access.log;
    error_log /var/log/nginx/backend-error.log;

    # Увеличить размер тела запроса (для загрузки фото)
    client_max_body_size 50M;

    # Проксирование на backend API
    location / {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        
        # Заголовки
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket поддержка (если используется)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # CORS заголовки (если нужно)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        # Для OPTIONS запросов
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

### 2.3 Активируйте конфигурацию:

```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить Nginx
sudo systemctl reload nginx
```

---

## Шаг 3: Настройка SSL в Cloudflare (2 минуты)

1. В **Cloudflare Dashboard** → **SSL/TLS**
2. Убедитесь, что режим установлен на **Flexible** или **Full**
   - **Flexible**: Cloudflare ↔ Сервер через HTTP (рекомендуется для старта)
   - **Full**: Cloudflare ↔ Сервер через HTTPS (если на сервере есть SSL)

3. В разделе **Edge Certificates** убедитесь, что:
   - ✅ **Always Use HTTPS** включено
   - ✅ **Automatic HTTPS Rewrites** включено

---

## Шаг 4: Проверка работоспособности (5 минут)

Подождите 2-5 минут для распространения DNS.

### Проверка в терминале:

```bash
# Проверка DNS (должен показать IP Cloudflare, например 172.67.x.x)
dig backend.seplitza.ru A +short

# Проверка HTTP (должен вернуть данные от API)
curl -I https://backend.seplitza.ru/health

# Тест авторизации (если есть endpoint)
curl -X POST https://backend.seplitza.ru/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Проверка в браузере:

Откройте в браузере:
- ✅ https://backend.seplitza.ru/health
- ✅ https://backend.seplitza.ru/api/exercises/public

---

## Шаг 5: Обновление конфигурации Frontend (3 минуты)

После того как Cloudflare прокси заработает, нужно изменить API URL в веб приложении.

### В файле `/web/src/config/api.ts`:

```typescript
// Production API URL (через Cloudflare)
const PRODUCTION_API_URL = 'https://backend.seplitza.ru';
const LOCAL_API_URL = 'http://localhost:9527';

// OLD Backend - для auth и курсов
const getOldApiUrl = (): string => {
  // Для локальной разработки
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return process.env.NEXT_PUBLIC_API_URL || LOCAL_API_URL;
  }
  
  // Для production - через Cloudflare
  return process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;
};
```

### В файле `/web/next.config.js`:

```javascript
env: {
  API_URL: process.env.NODE_ENV === 'production' ? 'https://backend.seplitza.ru' : (process.env.API_URL || 'http://localhost:9527'),
  NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' ? 'https://backend.seplitza.ru' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9527'),
},
```

---

## Шаг 6: Деплой изменений (2 минуты)

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web

# Коммит изменений
git add .
git commit -m "Fix: Использование Cloudflare прокси для backend API"
git push origin main

# Деплой на GitHub Pages
npm run deploy
```

---

## 📊 Итоговая конфигурация

| Сервис | Прямой URL | Cloudflare URL | Статус |
|--------|------------|----------------|--------|
| Backend API | http://37.252.20.170:9527 | https://backend.seplitza.ru | ✅ Через Cloudflare |
| Age Bot API | http://37.252.20.170:5000 | https://api.seplitza.ru/api/estimate-age | ✅ Через Cloudflare |
| Frontend | - | https://seplitza.github.io/rejuvena/ | ✅ GitHub Pages |

---

## 🔍 Диагностика проблем

### Проблема: DNS не резолвится
```bash
# Очистить DNS кэш (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Проверить nameservers
dig backend.seplitza.ru NS
```

### Проблема: 502 Bad Gateway
```bash
# Проверить работу backend API
ssh root@37.252.20.170
pm2 status
pm2 logs rejuvena-backend --lines 50

# Проверить Nginx
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/backend-error.log
```

### Проблема: CORS ошибки
- Убедитесь, что в Nginx конфигурации есть CORS заголовки
- Проверьте, что в Cloudflare **SSL/TLS** → **Edge Certificates** включен **Always Use HTTPS**

### Проблема: Медленная загрузка
- В Cloudflare включите **Speed** → **Optimization**:
  - ✅ Auto Minify (JS, CSS, HTML)
  - ✅ Brotli
  - ✅ Rocket Loader (опционально)

---

## ✅ Преимущества Cloudflare прокси

1. **Обход географических блокировок** - пользователи из любых регионов смогут подключиться
2. **Бесплатный SSL сертификат** - HTTPS без настройки Let's Encrypt
3. **DDoS защита** - автоматическая защита от атак
4. **CDN кэширование** - ускорение статических ресурсов
5. **Скрытие реального IP сервера** - дополнительная безопасность

---

## 📝 Примечания

- **Важно**: Оранжевое облако 🟠 (Proxied) должно быть ОБЯЗАТЕЛЬНО включено
- **SSL режим Flexible** подходит для большинства случаев
- **Порты**: Cloudflare проксирует только 80/443, поэтому нужен Nginx
- **Логи Nginx**: `/var/log/nginx/backend-access.log` и `backend-error.log`
- **PM2 backend**: Должен работать на `http://localhost:9527`

---

## 🆘 Поддержка

При проблемах проверьте:
1. DNS резолвится в Cloudflare IP (172.67.x.x или 104.21.x.x)
2. Nginx корректно проксирует на localhost:9527
3. PM2 процесс `rejuvena-backend` работает
4. Cloudflare SSL/TLS настроен на Flexible/Full
5. Firewall на сервере разрешает порты 80/443

**Telegram поддержка**: https://t.me/seplitza_support
