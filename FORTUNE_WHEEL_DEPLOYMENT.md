# Fortune Wheel - Deployment Guide

## 🎯 Цель
Создать призы для колеса фортуны на production сервере для запуска **завтра (8 марта 2026)**

## ✅ Что сделано

### 1. Backend API Endpoints (новые)
Созданы admin endpoints в `/src/routes/admin/fortune-wheel-admin.routes.ts`:

- **POST** `/api/admin/fortune-wheel/seed-prizes` - Создать начальные призы
- **DELETE** `/api/admin/fortune-wheel/delete-all-prizes` - Удалить все призы
- **GET** `/api/admin/fortune-wheel/stats` - Статистика призов

### 2. Prize Distribution (100% total)
Призы распределены с оптимальными вероятностями:

| Приз | Тип | Вероятность | Срок действия |
|------|-----|-------------|---------------|
| Бесплатный товар | freeProduct | 5% | 30 дней |
| Скидка 50% | discount | 10% | 14 дней |
| Скидка 30% | discount | 15% | 14 дней |
| Скидка 20% | discount | 20% | 7 дней |
| Бесплатная доставка | freeShipping | 20% | 7 дней |
| Скидка 10% | discount | 25% | 7 дней |
| Попробуйте еще раз | noWin | 5% | - |

### 3. Build готов
TypeScript скомпилирован в `/dist`, deployment package создан: `backend-deploy.tar.gz` (260KB)

---

## 🚀 Deployment Steps

### Вариант A: Через SSH (рекомендуется)

```bash
# 1. Загрузить пакет на сервер
scp backend-deploy.tar.gz root@37.252.20.170:/tmp/

# 2. Подключиться к серверу
ssh root@37.252.20.170

# 3. Развернуть обновление
cd /var/www/rejuvena-backend
tar -xzf /tmp/backend-deploy.tar.gz
npm ci --production
pm2 restart rejuvena-backend

# 4. Проверить статус
pm2 logs rejuvena-backend --lines 20
curl http://localhost:5000/health

# 5. Создать призы через API
curl -X POST "http://localhost:5000/api/admin/fortune-wheel/seed-prizes" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Проверить призы
curl "https://api-rejuvena.duckdns.org/api/fortune-wheel/prizes" | python3 -m json.tool

# 6. Выйти
exit
```

### Вариант B: Через Admin Panel UI (альтернатива)

Если есть доступ к admin панели:

1. Откройте https://api-rejuvena.duckdns.org/admin/
2. Войдите под admin аккаунтом
3. Перейдите в раздел "Fortune Wheel"
4. Нажмите "Seed Prizes" (создать начальные призы)

---

## 🔐 Admin Token

Используйте admin token из файла `/Backend-rejuvena/admin-token.txt`:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTkxZGE3ZGRhNDczNzMzMmYzYTg1M2IiLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTc3MjE4NTcyNiwiZXhwIjoxNzcyNzkwNTI2fQ.AhfCB7VGkXVcv3b21sLbqpBru7ipc3qbxl-tzgoE3DY
```

Или создайте новый:
```bash
curl -X POST https://api-rejuvena.duckdns.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seplitza@gmail.com","password":"1234back"}'
```

---

## ✅ Verification Checklist

После деплоя проверьте:

- [ ] **Сервер работает:** `curl https://api-rejuvena.duckdns.org/health`
- [ ] **Призы созданы:** `curl https://api-rejuvena.duckdns.org/api/fortune-wheel/prizes`
- [ ] **Всего 7 призов** в массиве
- [ ] **Сумма вероятностей = 100%**
- [ ] **Frontend открывается:** https://seplitza.github.io/rejuvena/fortune-wheel
- [ ] **Спин работает** (требует авторизации)

---

## 🐛 Troubleshooting

### Ошибка: "Cannot POST /api/admin/fortune-wheel/seed-prizes"
**Причина:** Backend не обновлен на production  
**Решение:** Выполните deployment (Вариант A, шаги 1-3)

### Ошибка: "Призы уже существуют"
**Решение:** Сначала удалите старые призы:
```bash
curl -X DELETE "https://api-rejuvena.duckdns.org/api/admin/fortune-wheel/delete-all-prizes" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ошибка: 401 Unauthorized
**Причина:** Неверный или истекший токен  
**Решение:** Получите новый токен через `/api/auth/login`

### Ошибка: "У вас нет доступных вращений"
**Причина:** У пользователя `fortuneWheelSpins = 0`  
**Решение:** Выдайте спины пользователям через admin panel или MongoDB:
```javascript
// В MongoDB shell
db.users.updateMany({}, { $set: { fortuneWheelSpins: 3 } })
```

---

## 📝 Next Steps (опционально)

После запуска завтра:

1. **Мониторинг:** Следить за статистикой выигрышей
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     https://api-rejuvena.duckdns.org/api/admin/fortune-wheel/stats
   ```

2. **Настройка изображений:** Загрузить иконки призов в `/uploads/` или CDN

3. **Email notifications:** Отправлять письма при выигрыше (интеграция с Resend)

4. **Analytics:** Подключить отслеживание конверсий в Amplitude

---

## 📞 Support

- **SSH доступ:** Пароль от root@37.252.20.170 (уточните у администратора)
- **Admin credentials:** seplitza@gmail.com / 1234back
- **Backend logs:** `pm2 logs rejuvena-backend`
- **MongoDB:** `mongosh mongodb://localhost:27017/rejuvena`

---

**Создано:** 7 марта 2026  
**Дедлайн запуска:** 8 марта 2026  
**Статус:** ✅ Готово к деплою
