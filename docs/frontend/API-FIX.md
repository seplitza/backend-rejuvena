# 🔧 Решение проблемы с API

## Проблема
Домен `api-rejuvena.duckdns.org` **не настроен** и недоступен.

## Диагностика
```bash
# DNS не может разрешить домен
$ host api-rejuvena.duckdns.org 8.8.8.8
Host api-rejuvena.duckdns.org not found: 2(SERVFAIL)

# Базовый домен тоже не настроен
$ host rejuvena.duckdns.org 8.8.8.8
Host rejuvena.duckdns.org not found: 2(SERVFAIL)
```

## Реализованное решение

### 1. Создан централизованный конфиг API
**Файл**: `web/src/config/api.ts`

```typescript
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // В разработке используем localhost
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      return 'http://localhost:9527';
    }
  }
  
  // Для продакшн используем переменную окружения
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9527';
};

export const API_URL = getApiUrl();
export const NEW_API_URL = API_URL; // Backward compatibility
```

### 2. Обновлены все файлы
- ✅ `web/src/pages/exercises.tsx` - использует `@/config/api`
- ✅ `web/src/pages/exercise/[exerciseId].tsx` - использует `@/config/api`

### 3. Автоматическое определение API
- **Localhost** (http://localhost:3000) → `http://localhost:9527`
- **Продакшн** (любой другой домен) → `process.env.NEXT_PUBLIC_API_URL`

## Как настроить DuckDNS

### Шаг 1: Регистрация
1. Перейдите на https://www.duckdns.org
2. Войдите через GitHub/Google
3. Создайте поддомен: `rejuvena`

### Шаг 2: Настройка IP
```bash
# Узнайте публичный IP вашего сервера
curl ifconfig.me

# Укажите этот IP в настройках DuckDNS
# Домен: rejuvena.duckdns.org
# IP: <ваш публичный IP>
```

### Шаг 3: Автообновление IP (если динамический IP)
```bash
# Создайте скрипт
mkdir ~/duckdns
cd ~/duckdns

# Создайте duck.sh
cat > duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=rejuvena&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

chmod +x duck.sh

# Добавьте в crontab (каждые 5 минут)
crontab -e
# Добавьте строку:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

### Шаг 4: Настройка nginx на сервере
```nginx
server {
    listen 80;
    server_name api-rejuvena.duckdns.org;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-rejuvena.duckdns.org;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api-rejuvena.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-rejuvena.duckdns.org/privkey.pem;
    
    location / {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Шаг 5: Получение SSL сертификата
```bash
# Установка Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d api-rejuvena.duckdns.org

# Автообновление (добавится автоматически)
sudo certbot renew --dry-run
```

### Шаг 6: Настройка переменных окружения
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api-rejuvena.duckdns.org
```

## Текущее состояние

### ✅ Работает (локально)
- Frontend: http://localhost:3000
- Backend: http://localhost:9527
- API автоматически определяет localhost

### ⏳ Требуется настройка (продакшн)
- [ ] Зарегистрировать домен на DuckDNS
- [ ] Настроить nginx на сервере
- [ ] Получить SSL сертификат
- [ ] Добавить NEXT_PUBLIC_API_URL в переменные окружения

## Команды для тестирования

### Проверка текущего API
```bash
# Открыть консоль браузера на странице упражнений
# Выполнить:
console.log('API URL:', 'http://localhost:9527');
```

### Проверка backend
```bash
curl http://localhost:9527/api/exercises/public | jq length
# Должно вернуть: 57
```

### Проверка frontend
```bash
# Открыть в браузере
http://localhost:3000/exercises
# Должны загрузиться упражнения
```

## Альтернативное решение (без DuckDNS)

Если не хотите использовать DuckDNS, можно:

1. **Купить домен** (например, на reg.ru)
2. **Использовать Ngrok** (для временного доступа)
3. **Использовать VPS с постоянным IP**

### Вариант с Ngrok (для демо)
```bash
# Установка
brew install ngrok

# Запуск туннеля
ngrok http 9527

# Использовать предоставленный URL
# Обновить NEXT_PUBLIC_API_URL=https://xxx.ngrok.io
```

## Итог

✅ **Проблема решена для локальной разработки**
- API автоматически использует localhost
- Build успешен
- Сервер запущен

⚠️ **Для продакшн деплоя нужно**:
1. Настроить DuckDNS домен
2. Настроить nginx и SSL
3. Установить переменную окружения NEXT_PUBLIC_API_URL
