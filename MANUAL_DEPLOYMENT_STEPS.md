# Ручной деплой на продакшн сервер

## Проблема
SSH подключение через терминал закрывается. Нужен ручной вход через SSH клиент.

## Сервер
- **IP**: 37.252.20.170
- **User**: root
- **Password**: c+d2Ei@GeWWKq8
- **Backend Path**: /root/app/backend-rejuvena
- **Admin Path**: /var/www/admin-panel

---

## ШАГ 1: Деплой Backend

### Подключитесь к серверу:
```bash
ssh root@37.252.20.170
# Пароль: c+d2Ei@GeWWKq8
```

### Обновите код:
```bash
cd /root/app/backend-rejuvena
git pull origin feature/shop
```

### Установите зависимости:
```bash
npm install
```

### Соберите проект:
```bash
npm run build
```

### Перезапустите PM2:
```bash
pm2 restart rejuvena-backend
# или если процесс не существует:
pm2 start dist/server.js --name rejuvena-backend

# Проверьте логи:
pm2 logs rejuvena-backend --lines 20
```

### Проверьте работоспособность:
```bash
curl http://localhost:9527/health
# Должен вернуть: {"status":"ok"}
```

---

## ШАГ 2: Деплой Admin Panel

### На локальной машине архивируйте билд:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel
tar -czf admin-dist.tar.gz dist/
```

### Загрузите на сервер (из локальной машины):
```bash
scp admin-dist.tar.gz root@37.252.20.170:/tmp/
# Пароль: c+d2Ei@GeWWKq8
```

### На сервере распакуйте:
```bash
ssh root@37.252.20.170
# Пароль: c+d2Ei@GeWWKq8

cd /var/www/admin-panel
rm -rf dist/  # Удалите старую версию
tar -xzf /tmp/admin-dist.tar.gz
rm /tmp/admin-dist.tar.gz
```

### Проверьте права доступа:
```bash
chown -R www-data:www-data /var/www/admin-panel/dist/
chmod -R 755 /var/www/admin-panel/dist/
```

### Перезапустите Nginx:
```bash
nginx -t  # Проверка конфигурации
systemctl reload nginx
```

### Проверьте в браузере:
```
http://37.252.20.170/admin  # или ваш домен
```

---

## ШАГ 3: Миграция базы данных

### Загрузите migration package на сервер:
```bash
# На локальной машине:
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/backups/pre-deployment-20260228
scp migration-package.tar.gz root@37.252.20.170:/tmp/
```

### На сервере распакуйте и выполните миграцию:
```bash
ssh root@37.252.20.170

cd /tmp
tar -xzf migration-package.tar.gz
cd migration-package

# ВАЖНО: Сначала сделайте бэкап продакшн БД!
mongodump --db rejuvena --out /root/backups/rejuvena-backup-$(date +%Y%m%d-%H%M%S)

# Запустите миграцию:
bash safe-migration.sh

# Проверьте результат:
mongo rejuvena --eval "db.orders.find({orderNumber: /^CRM-/}).count()"
# Должно быть: 10

mongo rejuvena --eval "db.coursepayments.find({orderNumber: /^CRM-COURSE-/}).count()"
# Должно быть: 4

mongo rejuvena --eval "db.users.find({createdAt: {\$gte: ISODate('2026-02-28T00:00:00Z')}}).count()"
# Должно быть: 9
```

---

## ШАГ 4: Проверка и тестирование

### 1. Проверьте PM2 процессы:
```bash
pm2 list
pm2 logs rejuvena-backend --lines 30
```

### 2. Проверьте API:
```bash
curl http://localhost:9527/health
curl http://localhost:9527/api/admin/users?page=1&limit=10
```

### 3. Проверьте админ панель в браузере:
- Откройте http://37.252.20.170/admin
- Войдите с admin credentials
- Найдите пользователя "Victoria" → проверьте заказ CRM-529 (должно быть 4500₽)
- Найдите "Ilona" → проверьте заказ CRM-530
- Откройте Products → проверьте ProductEditor с TipTap

### 4. Проверьте логи Nginx:
```bash
tail -50 /var/log/nginx/error.log
tail -50 /var/log/nginx/access.log
```

---

## ОТКАТ назад (если что-то пошло не так)

### Откат кода:
```bash
cd /root/app/backend-rejuvena
git checkout v1.3.0-pre-deployment
npm install
npm run build
pm2 restart rejuvena-backend
```

### Откат базы данных:
```bash
# Найдите последний бэкап:
ls -lh /root/backups/

# Восстановите:
mongorestore --db rejuvena --drop /root/backups/rejuvena-backup-20260228-XXXXXX/rejuvena
```

---

## Checklist после деплоя

- [ ] Backend отвечает на http://localhost:9527/health
- [ ] Admin panel открывается в браузере
- [ ] Victoria's order CRM-529 показывает 4500₽ (не 45₽)
- [ ] У Victoria видны заказы в списке пользователей
- [ ] ProductEditor с TipTap работает (emoji, rich text, image crop)
- [ ] Все старые пользователи марафона на месте (не удалились)
- [ ] CRM заказы импортированы (10 orders + 4 payments)
- [ ] PM2 логи без критических ошибок
- [ ] Nginx логи без 500 ошибок

---

## Контакты для проблем

Если возникли проблемы:
1. Проверьте PM2 логи: `pm2 logs rejuvena-backend`
2. Проверьте MongoDB: `mongo rejuvena --eval "db.orders.count()"`
3. Откатите на v1.3.0-pre-deployment если критично
4. Восстановите БД из бэкапа

**Git commits:**
- Текущий деплой: cd67b58 (feature/shop)
- Точка восстановления: v1.3.0-pre-deployment

**Бэкапы:**
- Локальный DB: `/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/backups/pre-deployment-20260228/`
- Продакшн DB: `/root/backups/rejuvena-backup-YYYYMMDD-HHMMSS/`
