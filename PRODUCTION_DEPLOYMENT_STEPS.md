# 🚀 Пошаговый Deployment на Production

## SSH Данные
**Server:** 37.252.20.170  
**User:** root  
**Password:** `c+d2Ei@GeWWKq8`  
**API:** https://api-rejuvena.duckdns.org

---

## ✅ Шаг 1: Загрузить backend-deploy.tar.gz

### Вариант A: С локальной машины
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena

# Ввести пароль при запросе: c+d2Ei@GeWWKq8
scp backend-deploy.tar.gz root@37.252.20.170:/tmp/
```

### Вариант B: Через FileZilla/SFTP
- Host: 37.252.20.170
- Port: 22
- Username: root
- Password: c+d2Ei@GeWWKq8
- Загрузить файл в `/tmp/backend-deploy.tar.gz`

---

## ✅ Шаг 2: Подключиться к серверу

```bash
ssh root@37.252.20.170
# Ввести пароль: c+d2Ei@GeWWKq8
```

---

## ✅ Шаг 3: Развернуть файлы

```bash
cd /var/www/rejuvena-backend
tar -xzf /tmp/backend-deploy.tar.gz
```

---

## ✅ Шаг 4: Установить зависимости

```bash
npm ci --production
```

---

## ✅ Шаг 5: Перезапустить backend

```bash
pm2 restart rejuvena-backend
```

---

## ✅ Шаг 6: Проверить работоспособность

```bash
# Подождать 5 секунд
sleep 5

# Проверить health
curl http://localhost:9527/health

# Должен вернуть: {"status":"ok","timestamp":"..."}
```

---

## ✅ Шаг 7: Получить admin токен

```bash
curl -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seplitza@gmail.com","password":"1234back"}' | python3 -m json.tool
```

**Скопируйте значение поля "token"**

---

## ✅ Шаг 8: Создать призы для колеса фортуны

```bash
# Вставьте свой токен вместо YOUR_TOKEN_HERE
curl -X POST http://localhost:9527/api/admin/fortune-wheel/seed-prizes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

Должен вернуть:
```json
{
  "success": true,
  "message": "Создано 12 призов",
  "distribution": [...]
}
```

---

## ✅ Шаг 9: Проверить призы

```bash
curl http://localhost:9527/api/fortune-wheel/prizes | python3 -m json.tool
```

Должно вернуть массив из **12 призов**.

---

## ✅ Шаг 10: Выдать спины пользователям

```bash
# Открыть MongoDB
mongosh mongodb://localhost:27017/rejuvena

# В MongoDB shell выполнить:
db.users.updateMany({}, { $set: { fortun eWheelSpins: 3 } })
db.users.countDocuments({ fortuneWheelSpins: { $gte: 1 } })

# Выйти из MongoDB
exit
```

---

## ✅ Шаг 11: Проверить с фронтенда

```bash
# Открыть в браузере
https://api-rejuvena.duckdns.org/api/fortune-wheel/prizes

# Должен показать JSON с 12 призами
```

---

## ✅ Шаг 12: Проверить логи

```bash
pm2 logs rejuvena-backend --lines 50
```

---

## 🎯 Результат

После выполнения всех 12 шагов:
- ✅ Backend обновлен с новым кодом
- ✅ 12 призов созданы для колеса фортуны
- ✅ API доступен на https://api-rejuvena.duckdns.org
- ✅ Готово к запуску завтра!

---

## 🐛 Troubleshooting

### Ошибка: "Cannot POST /api/admin/fortune-wheel/seed-prizes"
**Решение:** Backend не обновлен, повторите шаги 3-5

### Ошибка: 401 Unauthorized
**Решение:** Токен истек, получите новый (шаг 7)

### Ошибка: "Призы уже существуют"
**Решение:** Сначала удалите старые:
```bash
curl -X DELETE http://localhost:9527/api/admin/fortune-wheel/delete-all-prizes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Backend не перезапускается
```bash
pm2 delete rejuvena-backend
NODE_ENV=production pm2 start dist/server.js --name rejuvena-backend
pm2 save
```

---

**Статус:** Готово к deployment  
**Дата:** 7 марта 2026  
**Дедлайн:** 8 марта 2026 (завтра)  
