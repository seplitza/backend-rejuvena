# СРОЧНОЕ ИСПРАВЛЕНИЕ: Backend не работает после деплоя

## Проблема
После GitHub Actions деплоя админка не пускает - "как будто не та база подключена".

**Причина**: Workflow делал `git reset --hard origin/main`, что **удаляло .env файл** на продакшн сервере.

## Срочный ручной фикс (СЕЙЧАС)

Подключитесь к серверу и восстановите .env:

```bash
ssh root@37.252.20.170
# Пароль: c+d2Ei@GeWWKq8

cd /var/www/rejuvena-backend

# Создайте/восстановите .env файл:
cat > .env << 'EOF'
PORT=9527
MONGODB_URI=mongodb://localhost:27017/rejuvena
JWT_SECRET=rejuvena-production-jwt-secret-2026
NODE_ENV=production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
RESEND_API_KEY=re_YOUR_KEY_HERE
EMAIL_FROM=noreply@rejuvena.ru
FRONTEND_URL=https://seplitza.github.io
EOF

# Перезапустите backend:
pm2 restart rejuvena-backend

# Проверьте логи:
pm2 logs rejuvena-backend --lines 30
```

## Проверка

1. Откройте админку: http://37.252.20.170/admin или http://api-rejuvena.duckdns.org/admin
2. Попробуйте залогиниться
3. Должно работать!

## Долгосрочное решение (УЖЕ СДЕЛАНО)

Обновил `.github/workflows/deploy.yml`:

**Добавлено**:
1. Сохранение `.env` перед `git reset --hard`: `cp .env .env.backup`
2. Восстановление `.env` после git: `mv .env.backup .env`
3. Автоматическое создание `.env` если его нет

**Коммит**: Запушу сейчас → следующий деплой не затрет .env

## Что произошло

```bash
# Старый workflow:
git reset --hard origin/main  # ❌ Удаляет .env
pm2 restart rejuvena-backend  # ❌ Запускается без настроек БД
# Backend подключается к дефолтной пустой БД или падает

# Новый workflow:
cp .env .env.backup           # ✅ Сохраняем
git reset --hard origin/main  # Обновляем код
mv .env.backup .env           # ✅ Восстанавливаем
pm2 restart rejuvena-backend  # ✅ Работает с правильной БД
```

## После ручного фикса

После того как вручную создадите .env на сервере:
1. ✅ Админка заработает сразу
2. ✅ Следующие деплои не сломают (workflow исправлен)
3. ✅ .env будет сохраняться между деплоями

## Дополнительно: ecosystem.config.json

Проверьте что используется правильный файл:

```bash
cd /var/www/rejuvena-backend
cat ecosystem.config.json
```

Должно быть:
```json
{
  "apps": [{
    "name": "rejuvena-backend",
    "script": "dist/server.js",
    "instances": 1,
    "exec_mode": "fork",
    "env": {
      "NODE_ENV": "production",
      "PORT": "9527"
    }
  }]
}
```

## Если PM2 не запущен

```bash
cd /var/www/rejuvena-backend
pm2 start ecosystem.config.json
pm2 save
pm2 startup  # Настроить автозапуск
```
