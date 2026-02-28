# ДИАГНОСТИКА ПРОБЛЕМЫ С ЛОГИНОМ

## Проблема
- ❌ Админка не пускает при логине
- ❌ Фронтенд приложение тоже не пускает пользователей

## Причина скорее всего:
1. Backend не запущен / упал
2. .env файл некорректный
3. MongoDB не подключена
4. JWT_SECRET изменился (токены стали невалидны)

---

## СРОЧНАЯ ДИАГНОСТИКА

### 1. Подключитесь к серверу:
```bash
ssh root@37.252.20.170
# Пароль: c+d2Ei@GeWWKq8
```

### 2. Проверьте PM2 процессы:
```bash
pm2 list
pm2 logs rejuvena-backend --lines 50
```

**Что смотреть:**
- ✅ Процесс должен быть `online` (зеленый)
- ❌ Если `errored` / `stopped` - упал
- 🔍 В логах смотрите ошибки подключения к MongoDB

### 3. Проверьте .env файл:
```bash
cd /var/www/rejuvena-backend
cat .env
```

**Должно быть:**
```
PORT=9527
MONGODB_URI=mongodb://localhost:27017/rejuvena
JWT_SECRET=rejuvena-production-jwt-secret-2026
NODE_ENV=production
```

**ВАЖНО**: Если JWT_SECRET не `rejuvena-production-jwt-secret-2026`, это объясняет почему старые пользователи не могут залогиниться!

### 4. Проверьте MongoDB:
```bash
mongo rejuvena --quiet --eval "db.users.count()"
# Должно показать количество пользователей (не 0)

mongo rejuvena --quiet --eval "db.users.findOne({role: 'admin'})"
# Должен найти админа
```

### 5. Проверьте health endpoint:
```bash
curl http://localhost:9527/health
# Должен вернуть: {"status":"ok","timestamp":"..."}
```

### 6. Проверьте admin login API:
```bash
# Сначала узнайте email/password админа:
mongo rejuvena --quiet --eval "db.users.findOne({role: 'admin'})" | grep -E 'email|password'

# Или создайте admin токен напрямую (обход):
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'admin-id', role: 'admin' }, 
  'rejuvena-production-jwt-secret-2026',
  { expiresIn: '30d' }
);
console.log('Admin Token:', token);
"
```

---

## БЫСТРОЕ РЕШЕНИЕ

### Если PM2 упал - перезапустите:
```bash
cd /var/www/rejuvena-backend
pm2 restart rejuvena-backend

# Если не помогло - остановите и запустите заново:
pm2 delete rejuvena-backend
pm2 start ecosystem.config.json
pm2 save
```

### Если .env нет или неправильный:
```bash
cd /var/www/rejuvena-backend
cat > .env << 'EOF'
PORT=9527
MONGODB_URI=mongodb://localhost:27017/rejuvena
JWT_SECRET=rejuvena-production-jwt-secret-2026
NODE_ENV=production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
EMAIL_FROM=noreply@rejuvena.ru
FRONTEND_URL=https://seplitza.github.io
EOF

pm2 restart rejuvena-backend
```

### Если MongoDB не запущена:
```bash
systemctl status mongod
systemctl start mongod
```

---

## КРИТИЧЕСКАЯ ПРОБЛЕМА: JWT_SECRET

Если JWT_SECRET изменился после деплоя - все старые токены пользователей невалидны!

**Решение 1**: Вернуть старый JWT_SECRET
Проверьте старый .env (если есть бэкап):
```bash
cd /var/www/rejuvena-backend/backups
ls -lt | head -5  # Найдите последний бэкап
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz --to-stdout .env 2>/dev/null || echo "Нет .env в бэкапе"
```

**Решение 2**: Пользователям придется перелогиниться
- Админ: создать новый пароль
- Фронт пользователи: сбросить пароль через "Forgot password"

---

## СРОЧНО ВЫПОЛНИТЕ И ОТПРАВЬТЕ РЕЗУЛЬТАТЫ:

```bash
# 1. PM2 статус:
pm2 list

# 2. PM2 логи (последние 50 строк):
pm2 logs rejuvena-backend --lines 50 --nostream

# 3. Содержимое .env:
cat /var/www/rejuvena-backend/.env

# 4. Health check:
curl http://localhost:9527/health

# 5. MongoDB статус:
systemctl status mongod | head -10
```

Пришлите вывод этих команд - тогда смогу точно сказать в чем проблема!

---

## Если ничего не помогает - ОТКАТ

```bash
cd /var/www/rejuvena-backend

# Найдите последний бэкап:
ls -lh backups/ | tail -3

# Восстановите:
tar -xzf backups/backup-YYYYMMDD-HHMMSS.tar.gz

# Перезапустите:
pm2 restart rejuvena-backend
```
