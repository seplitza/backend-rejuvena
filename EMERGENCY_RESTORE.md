# 🚨 Экстренное восстановление системы

Используйте эту инструкцию если **все сломалось** и нужно быстро вернуться к последней рабочей версии.

---

## ⚡ Быстрое восстановление (5 минут)

### 1. Backend (локально)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git fetch origin
git checkout d58c280
npm install
npm run build
cd admin-panel && npm install && npm run build && cd ..
npm run dev
```
✅ Backend доступен: http://localhost:9527

### 2. Frontend (локально)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git fetch origin
git checkout f31937c
npm install
npm run dev
```
✅ Frontend доступен: http://localhost:3000

### 3. Production Backend
```bash
ssh root@37.252.20.170
cd /var/www/rejuvena-backend
git stash  # Сохранить локальные изменения если есть
git fetch origin
git checkout d58c280
npm install
npm run build
cd admin-panel && npm install && npm run build && cd ..
pm2 restart rejuvena-backend
pm2 logs rejuvena-backend --lines 50
```
✅ Проверить: https://api-rejuvena.duckdns.org/api/health

### 4. Production Frontend
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git fetch origin
git checkout f31937c
npm install
npm run build
npx gh-pages -d out -m "Emergency restore: v1.4.0 stable"
```
⏳ Подождать 5-10 минут (GitHub Pages deploy)  
✅ Проверить: https://seplitza.github.io/rejuvena/

---

## 🔍 Проверка после восстановления

### Backend:
- [ ] https://api-rejuvena.duckdns.org/api/health отвечает 200
- [ ] https://api-rejuvena.duckdns.org/admin/ открывается
- [ ] Логин в админку работает: `seplitza@gmail.com` / `1234back`
- [ ] PM2 процесс работает: `ssh root@37.252.20.170 "pm2 list"`

### Frontend:
- [ ] https://seplitza.github.io/rejuvena/ открывается
- [ ] Логин работает
- [ ] Марафоны отображаются
- [ ] Упражнения загружаются

---

## 📋 Версия восстановления

**Backend:** commit `d58c280` (14 февраля 2026)  
**Frontend:** commit `f31937c` (14 февраля 2026)  
**Версия:** v1.4.0 - Video Support

**Что работает:**
- ✅ Марафоны с упражнениями
- ✅ Видео в TipTap редакторе (YouTube, Vimeo, Rutube, VK, OK)
- ✅ Навигация на текущий день марафона
- ✅ Оплата через Альфа-банк
- ✅ Email уведомления (Resend)
- ✅ Прогресс упражнений (галочки сохраняются)

---

## 🆘 Если восстановление не помогло

### 1. Проверить базу данных MongoDB
```bash
ssh root@37.252.20.170
mongosh mongodb://localhost:27017/rejuvena
db.users.countDocuments()  # Должно быть > 0
db.marathons.countDocuments()  # Должно быть > 0
```

### 2. Проверить .env файлы
```bash
ssh root@37.252.20.170
cat /var/www/rejuvena-backend/.env
# Проверить наличие:
# - MONGODB_URI
# - JWT_SECRET
# - ALFABANK_USERNAME
# - RESEND_API_KEY
```

### 3. Полная переустановка
См. [QUICKSTART.md](./QUICKSTART.md) для пошаговой инструкции.

---

## 📞 Критическая информация

**Сервер:** 37.252.20.170  
**SSH:** `root@37.252.20.170`  
**MongoDB:** `mongodb://localhost:27017/rejuvena`  
**PM2 процессы:** `rejuvena-backend`, `marathon-notifier`

**GitHub:**
- Backend: https://github.com/seplitza/backend-rejuvena
- Frontend: https://github.com/seplitza/rejuvena

**Документация:**
- Полная точка восстановления: [RESTORE_POINT_2026-02-14_VIDEO_SUPPORT.md](./RESTORE_POINT_2026-02-14_VIDEO_SUPPORT.md)
- Индекс всех версий: [RESTORE_POINTS_INDEX.md](./RESTORE_POINTS_INDEX.md)

---

**Создано:** 14 февраля 2026 г.  
**Обновлять:** После каждой новой стабильной версии
