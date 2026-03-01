# Инструкция по деплою исправлений импорта

## Проблема
Страница импорта данных возвращает ошибку 400 и HTML вместо JSON.

## Причина
На production сервере еще старый код без роута `/api/admin/data-import`.

## Исправления в коде
✅ Исправлено использование API клиента в DataImport.tsx
✅ Роут data-import.routes.ts уже подключен в server.ts
✅ Коммит f966748 запушен в main

## Деплой на production

### 1. SSH на сервер и обновить код

```bash
ssh root@37.252.20.170
cd /var/www/rejuvena-backend
git pull origin main
```

### 2. Установить зависимости (если есть новые)

```bash
npm install
```

### 3. Пересобрать backend

```bash
npm run build
```

### 4. Перезапустить backend

```bash
pm2 restart rejuvena-backend
```

### 5. Пересобрать админ-панель

```bash
cd admin-panel
npm install
npm run build
cd ..
```

### 6. Проверить логи

```bash
pm2 logs rejuvena-backend --lines 50
```

Должно быть:
```
✅ Connected to MongoDB
Server running on port 3000
```

## Проверка работы импорта

### 1. Откройте страницу импорта
https://api-rejuvena.duckdns.org/admin/data-import

### 2. Загрузите тестовый файл

Используйте файл из репозитория:
- `/test-data/sample-orders.csv` - тестовые заказы
- `/test-data/sample-payments.json` - тестовые платежи

### 3. Нажмите "Предпросмотр"

Должно показать:
- Тип данных: Заказы (или Платежи)
- Всего записей: 3
- Таблицу с первыми 10 записями

### 4. Проверьте в консоли браузера

Не должно быть ошибок:
- ❌ `400 (Bad Request)` - означает что роут не работает
- ❌ `Unexpected token '<'` - означает что сервер вернул HTML вместо JSON

Должно быть:
- ✅ `200 OK` - успешный запрос
- ✅ `{success: true, data: {...}}` - корректный ответ

## Если импорт всё еще не работает

### Проверка 1: Роут зарегистрирован?

```bash
# На сервере
cd /var/www/rejuvena-backend
grep -n "data-import" src/server.ts
```

Должно быть две строки:
```
36:import dataImportRoutes from './routes/data-import.routes';
109:app.use('/api/admin/data-import', dataImportRoutes);
```

### Проверка 2: Файл роута существует?

```bash
ls -la src/routes/data-import.routes.ts
```

Должно показать файл ~394 строки.

### Проверка 3: Backend перезапустился?

```bash
pm2 status
```

Должно показать:
```
rejuvena-backend │ online │ 0 │ ...
```

Если `restart`:
```bash
pm2 restart rejuvena-backend
pm2 logs rejuvena-backend
```

### Проверка 4: Порт и nginx

```bash
# Проверить что nginx проксирует на правильный порт
cat /etc/nginx/sites-enabled/api-rejuvena | grep proxy_pass
```

Должно быть:
```
proxy_pass http://localhost:3000;
```

```bash
# Перезапустить nginx
sudo systemctl reload nginx
```

## Частые проблемы

### Проблема: "Cannot find module './routes/data-import.routes'"

**Решение:**
```bash
cd /var/www/rejuvena-backend
npm run build
pm2 restart rejuvena-backend
```

### Проблема: "Unexpected token '<'"

**Причина:** Backend возвращает HTML (обычно страница ошибки Express)

**Решение:** Проверить логи backend:
```bash
pm2 logs rejuvena-backend --lines 100
```

Искать ошибки импорта модулей или проблемы с БД.

### Проблема: "Cannot read properties of undefined (reading 'history')"

**Причина:** API возвращает неправильный формат данных

**Решение:** API должен возвращать:
```json
{
  "success": true,
  "data": {
    "history": []
  }
}
```

Проверить в `src/routes/data-import.routes.ts` строка ~370-390.

## После успешного деплоя

1. ✅ Импорт должен работать с CSV и JSON
2. ✅ Предпросмотр показывает первые 10 записей
3. ✅ Можно импортировать с режимами insert/upsert/replace
4. ✅ История импорта логируется

## Контакты

Если проблемы остаются - проверьте:
- Логи backend: `pm2 logs rejuvena-backend`
- Логи nginx: `tail -f /var/log/nginx/error.log`
- Консоль браузера: Network tab для деталей запросов

---

**Дата:** 1 марта 2026
**Коммит:** f966748
**Статус:** Готово к деплою на production
