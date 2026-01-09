# Инструкция по деплою Rejuvena (для AI-агента)

## ✅ ТЕКУЩАЯ РАБОЧАЯ КОНФИГУРАЦИЯ

**Дата:** 9 января 2026
**Статус:** Админ-панель и фронтенд работают корректно

### Инфраструктура
- **Сервер:** 37.252.20.170 (api-rejuvena.duckdns.org)
- **Backend API:** http://37.252.20.170:9527 (PM2: rejuvena-backend)
- **Admin Panel:** https://api-rejuvena.duckdns.org/admin/
- **Frontend:** https://seplitza.github.io/rejuvena/exercises

### Репозитории Git
1. **Backend:** https://github.com/seplitza/backend-rejuvena
   - Путь: `/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena`
   - Админ-панель находится в `admin-panel/`
   
2. **Frontend:** https://github.com/seplitza/web
   - Путь: `/Users/alexeipinaev/Documents/Rejuvena/web`
   - Next.js приложение

---

## 📋 КРИТИЧЕСКИЕ ПРАВИЛА

### 1. ВСЕГДА КОММИТИТЬ ИЗМЕНЕНИЯ
❌ **НИКОГДА** не меняй код без коммита в Git!
✅ После каждого изменения:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git add -A
git commit -m "Описание изменений"
git push
```

### 2. КАКОЙ РЕПОЗИТОРИЙ ИСПОЛЬЗОВАТЬ
- **Изменения в admin-panel/** → backend-rejuvena
- **Изменения в backend (API, models, routes)** → backend-rejuvena
- **Изменения в web/src/** → web
- **При сомнениях** → backend-rejuvena

---

## 🚀 ДЕПЛОЙ АДМИН-ПАНЕЛИ

### Когда делать деплой
- После изменений в `admin-panel/src/`
- После изменений в `admin-panel/vite.config.ts`
- После изменений в `.env.production`

### Последовательность действий

1. **Коммит изменений в Git:**
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git add -A
git commit -m "Описание изменений"
git push
```

2. **Деплой на сервер:**
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
./deploy-admin.sh
```

### Важные настройки админ-панели
- **API URL:** `https://api-rejuvena.duckdns.org/api` (задается через `VITE_API_URL`)
- **Router basename:** `/admin` (в `App.tsx`)
- **Vite base:** `/admin/` (в `vite.config.ts`)
- **Nginx location:** `/admin/` (на сервере)

---

## 🌐 ДЕПЛОЙ ФРОНТЕНДА (GitHub Pages)

### Когда делать деплой
- После изменений в `web/src/`
- После добавления новых компонентов
- После изменений API конфигурации

### Последовательность действий

1. **Коммит изменений в Git:**
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git add -A
git commit -m "Описание изменений"
git push
```

2. **Сборка и деплой:**
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run build
npm run export
npx gh-pages -d out
```

### Важные настройки фронтенда
- **API URL:** `http://37.252.20.170:9527` (production)
- **Base URL:** `/rejuvena` (GitHub Pages)
- **Output:** Static export (`next.config.js`)

---

## 🔧 РАБОТА С БЭКЕНДОМ

### Перезапуск бэкенда
```bash
ssh root@37.252.20.170 "pm2 restart rejuvena-backend"
```

### Проверка логов
```bash
ssh root@37.252.20.170 "pm2 logs rejuvena-backend --lines 50"
```

### Проверка статуса
```bash
ssh root@37.252.20.170 "pm2 list"
```

---

## 📝 ТИПИЧНЫЕ СЦЕНАРИИ

### Сценарий 1: Изменение логики админ-панели
```bash
# 1. Правим файл
vim admin-panel/src/pages/Dashboard.tsx

# 2. Коммитим
git add admin-panel/src/pages/Dashboard.tsx
git commit -m "Update dashboard layout"
git push

# 3. Деплоим
./deploy-admin.sh
```

### Сценарий 2: Добавление нового API роута
```bash
# 1. Правим бэкенд
vim src/routes/exercises.ts

# 2. Коммитим
git add src/routes/exercises.ts
git commit -m "Add new exercise endpoint"
git push

# 3. Перезапускаем PM2
ssh root@37.252.20.170 "pm2 restart rejuvena-backend"
```

### Сценарий 3: Изменение UI фронтенда
```bash
# 1. Переходим в web
cd /Users/alexeipinaev/Documents/Rejuvena/web

# 2. Правим компонент
vim src/components/PaymentModal.tsx

# 3. Коммитим
git add src/components/PaymentModal.tsx
git commit -m "Update payment modal design"
git push

# 4. Деплоим на GitHub Pages
npm run build && npm run export && npx gh-pages -d out
```

---

## ⚠️ ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ

- [ ] Все изменения закоммичены в Git
- [ ] Изменения запушены на GitHub
- [ ] Проверены переменные окружения
- [ ] Запущена сборка без ошибок
- [ ] После деплоя проверен URL в браузере

---

## 🔍 ДИАГНОСТИКА ПРОБЛЕМ

### Админ-панель не загружается (белая страница)
1. Проверить консоль браузера (F12)
2. Проверить API URL в коде: `grep -r "localhost" admin-panel/dist/`
3. Проверить basename в роутере: должен быть `/admin`
4. Очистить кеш браузера (Cmd+Shift+R)

### API не отвечает
1. Проверить PM2: `ssh root@37.252.20.170 "pm2 list"`
2. Проверить логи: `ssh root@37.252.20.170 "pm2 logs rejuvena-backend"`
3. Проверить порт: `ssh root@37.252.20.170 "netstat -tulpn | grep 9527"`

### Nginx проблемы
1. Проверить конфиг: `ssh root@37.252.20.170 "nginx -t"`
2. Перезапустить: `ssh root@37.252.20.170 "systemctl restart nginx"`
3. Проверить логи: `ssh root@37.252.20.170 "tail -50 /var/log/nginx/error.log"`

---

## 📌 КРИТИЧЕСКИЕ ФАЙЛЫ

### Backend (backend-rejuvena)
- `admin-panel/src/App.tsx` - Router с basename
- `admin-panel/vite.config.ts` - Vite конфигурация
- `admin-panel/.env.production` - Prod переменные
- `deploy-admin.sh` - Скрипт деплоя

### Frontend (web)
- `src/config/api.ts` - API URL конфигурация
- `next.config.js` - Next.js настройки
- `package.json` - Скрипты сборки

### Сервер
- `/etc/nginx/sites-available/rejuvena` - Nginx конфиг
- `/var/www/rejuvena-backend/admin-panel/` - Админ-панель
- PM2 процесс: `rejuvena-backend`

---

## 🎯 GOLDEN RULE

**ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ КОДА:**
1. ✅ Git commit
2. ✅ Git push  
3. ✅ Deploy (если нужно)
4. ✅ Проверка в браузере

**НИКОГДА НЕ ОСТАВЛЯЙ КОД БЕЗ КОММИТА!**
