# СРОЧНОЕ ИСПРАВЛЕНИЕ - JWT_SECRET ПРОБЛЕМА

## 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА

**Диагноз**: Неправильный `JWT_SECRET` на продакшн сервере

**Последствия**:
- ❌ Все токены пользователей невалидны
- ❌ Админка не пускает
- ❌ Фронтенд приложение не пускает пользователей

**Причина**: 
Workflow создал `.env` с `JWT_SECRET=rejuvena-production-jwt-secret-2026`, 
а должен быть `JWT_SECRET=rejuvena-super-secret-key-2026`

---

## ⚡ СРОЧНОЕ РЕШЕНИЕ (ПРЯМО СЕЙЧАС)

### 1. Подключитесь к серверу:
```bash
ssh root@37.252.20.170
# Пароль: c+d2Ei@GeWWKq8
```

### 2. Перейдите в директорию backend:
```bash
cd /var/www/rejuvena-backend
```

### 3. Создайте правильный .env файл:
```bash
cat > .env << 'ENVEOF'
PORT=9527
MONGODB_URI=mongodb://localhost:27017/rejuvena
JWT_SECRET=rejuvena-super-secret-key-2026
NODE_ENV=production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800

# Alfabank Payment Gateway (PRODUCTION)
ALFABANK_USERNAME=r-seplitza-api
ALFABANK_PASSWORD=D!ndA6U65Bx*bKq
ALFABANK_API_URL=https://payment.alfabank.ru/payment/rest
ALFABANK_RETURN_URL=https://seplitza.github.io/rejuvena/payment/success
ALFABANK_FAIL_URL=https://seplitza.github.io/rejuvena/payment/fail

# Frontend URL for redirects
FRONTEND_URL=https://seplitza.github.io/rejuvena

# Resend Email Service
RESEND_API_KEY=re_rj675j5x_DELv28yV2qGtTK5Dwzs6B872
EMAIL_FROM=noreply@mail.seplitza.ru

# Wildberries API (Marketplace Integration)
WB_API_TOKEN=eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwOTA0djEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzg3OTUxNjc0LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTljOWU2MC1kZjJjLTdkOWYtOWQxMC0wMjdhOTU0ODI4M2YiLCJpaWQiOjQ4MzAzMjI4LCJvaWQiOjQxMTY4ODMsInMiOjgxNjYyLCJzaWQiOiIzNDAxYjNmMS1jMWU4LTQxMGMtOWMyZi00Y2U4NTcwNTliZGIiLCJ0IjpmYWxzZSwidWlkIjo0ODMwMzIyOH0.MF9v427pQ2lNdmQdKkfN3H4D15nDzod81fHYPmnRf-NFelRxvUuPkSQ_eOVwnmIueqgDXbG14LdSsmF5p7a9lA
WB_SELLER_ID=41168883
ENVEOF
```

### 4. Проверьте что .env создан правильно:
```bash
cat .env | grep JWT_SECRET
# Должно показать: JWT_SECRET=rejuvena-super-secret-key-2026
```

### 5. Перезапустите backend:
```bash
pm2 restart rejuvena-backend

# Проверьте статус:
pm2 status

# Посмотрите логи:
pm2 logs rejuvena-backend --lines 20
```

### 6. Проверьте что backend запустился:
```bash
curl http://localhost:9527/health
# Должен вернуть: {"status":"ok","timestamp":"..."}
```

---

## ✅ ПРОВЕРКА РЕЗУЛЬТАТА

### 1. Админка:
Откройте: http://37.252.20.170/admin или http://api-rejuvena.duckdns.org/admin

Попробуйте залогиниться - должно работать! ✅

### 2. Фронтенд приложение:
Пользователи должны смочь залогиниться с своими учетками.

---

## 🔧 ЧТО ИСПРАВЛЕНО В КОДЕ

Коммит `c984c55` исправил workflow:

**Было (неправильно):**
```bash
JWT_SECRET=rejuvena-production-jwt-secret-2026
```

**Стало (правильно):**
```bash
JWT_SECRET=rejuvena-super-secret-key-2026
```

Также добавлены все production credentials:
- ✅ Alfabank API (платежи)
- ✅ Resend API (email)
- ✅ Wildberries API (маркетплейс)

---

## 📋 ПОСЛЕ ИСПРАВЛЕНИЯ

После создания правильного `.env` и перезапуска PM2:

1. ✅ Все токены пользователей снова валидны
2. ✅ Админка работает
3. ✅ Фронтенд приложение работает
4. ✅ Платежи работают (Alfabank credentials на месте)
5. ✅ Email уведомления работают (Resend key на месте)

---

## 🆘 ЕСЛИ НЕ ПОМОГЛО

### Проверьте PM2 логи:
```bash
pm2 logs rejuvena-backend --lines 100
```

Ищите ошибки:
- `MongoDB connection error` - проблема с БД
- `JWT` - проблема с токенами
- `EADDRINUSE` - порт 9527 занят

### Перезапустите с нуля:
```bash
pm2 delete rejuvena-backend
cd /var/www/rejuvena-backend
pm2 start ecosystem.config.json
pm2 save
```

### Проверьте MongoDB:
```bash
systemctl status mongod
mongo rejuvena --eval "db.users.count()"
```

---

## 📞 ОТЧЕТ

После выполнения всех шагов, отправьте вывод этих команд:

```bash
# 1. Проверка .env:
cat /var/www/rejuvena-backend/.env | grep JWT_SECRET

# 2. PM2 статус:
pm2 list

# 3. Health check:
curl http://localhost:9527/health

# 4. Можете ли залогиниться в админку?
```

Это поможет убедиться что все работает!
