# Деплой Админ-панели на Timeweb - Выполнено

## Что сделано

### 1. Подготовка проекта

**Создан файл `.env.production` для админки:**
```bash
Backend-rejuvena/admin-panel/.env.production
```
```env
VITE_API_URL=https://api-rejuvena.duckdns.org
```

**Обновлен `vite.config.ts` для работы с base path:**
```typescript
// Backend-rejuvena/admin-panel/vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/admin/',  // Добавлен base path
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9527',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:9527',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
```

### 2. Создан скрипт деплоя

**Файл: `Backend-rejuvena/deploy-admin.sh`**
```bash
#!/bin/bash

SERVER_IP="37.252.20.170"
SERVER_USER="root"
APP_DIR="/var/www/rejuvena-backend"
ADMIN_DIR="$APP_DIR/admin-panel"

echo "🚀 Deploying Rejuvena Admin Panel to Timeweb Cloud"

# Build admin panel
cd admin-panel
npm run build

# Create deployment package
cd ..
tar -czf admin-deploy.tar.gz -C admin-panel/dist .

# Upload to server
scp admin-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Setup on server
ssh $SERVER_USER@$SERVER_IP << EOF
  mkdir -p $ADMIN_DIR
  cd $ADMIN_DIR
  tar -xzf /tmp/admin-deploy.tar.gz
  rm /tmp/admin-deploy.tar.gz
  chown -R www-data:www-data $ADMIN_DIR
EOF

rm admin-deploy.tar.gz

echo "✅ Deployment complete!"
echo "📍 Admin panel URL: https://api-rejuvena.duckdns.org/admin"
```

Сделан исполняемым: `chmod +x deploy-admin.sh`

### 3. Обновлена конфигурация Nginx

**Файл: `Backend-rejuvena/nginx.conf`**
```nginx
server {
    listen 80;
    server_name api-rejuvena.duckdns.org;

    # Root redirects to admin
    location = / {
        return 301 /admin/;
    }

    # Serve admin panel
    location /admin/ {
        alias /var/www/rejuvena-backend/admin-panel/;
        try_files $uri $uri/ /index.html =404;
        index index.html;
        
        # Set correct MIME types
        types {
            text/html html;
            text/css css;
            application/javascript js;
            application/json json;
        }
    }

    location /admin {
        return 301 /admin/;
    }

    # Serve uploaded media
    location /uploads/ {
        alias /var/www/rejuvena-backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # API proxy and other backend routes
    location / {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Выполнен деплой

```bash
# 1. Билд и загрузка админки
./deploy-admin.sh

# 2. Обновление nginx конфигурации
cat nginx.conf | ssh root@37.252.20.170 'cat > /etc/nginx/sites-available/rejuvena'

# 3. Проверка и перезапуск nginx
ssh root@37.252.20.170 'nginx -t && systemctl restart nginx'
```

## Результат

### Структура на сервере
```
/var/www/rejuvena-backend/
├── dist/              # Backend API (Node.js)
├── admin-panel/       # Статичная админка (React build)
│   ├── index.html
│   └── assets/
│       ├── index-*.js
│       └── index-*.css
├── uploads/           # Загруженные медиафайлы
├── logs/
├── node_modules/
├── package.json
└── .env
```

### URLs
- **Админка**: http://api-rejuvena.duckdns.org/admin/
- **Backend API**: http://api-rejuvena.duckdns.org/api/
- **Health check**: http://api-rejuvena.duckdns.org/health
- **Медиа**: http://api-rejuvena.duckdns.org/uploads/

### Доступ
- Email: seplitza@gmail.com
- Password: 1234back

## Текущий статус

✅ Админка собрана и загружена  
✅ Nginx конфигурация обновлена  
✅ Backend API работает  
✅ Статика отдается корректно  
⚠️  **Админка не загружается в браузере (пустой экран)**

## Что нужно проверить в другом чате

### 1. API работает?
```bash
curl http://api-rejuvena.duckdns.org/health
curl http://api-rejuvena.duckdns.org/api/exercises/public
```

### 2. CORS настроен?
Backend должен разрешать запросы с домена `api-rejuvena.duckdns.org`

### 3. Backend слушает правильный порт?
Backend должен быть на `localhost:9527` (проверить PM2)

### 4. MongoDB работает?
```bash
ssh root@37.252.20.170 'systemctl status mongod'
```

### 5. Возможные проблемы
- **CORS**: Backend может блокировать запросы от админки
- **API URL**: Админка запрашивает API по относительным путям `/api/*`
- **Authentication**: JWT токены и авторизация
- **Environment**: `.env` файл backend'а должен быть настроен

## Логи для проверки

```bash
# Backend логи
ssh root@37.252.20.170 'pm2 logs rejuvena-backend'

# Nginx логи
ssh root@37.252.20.170 'tail -f /var/log/nginx/error.log'
ssh root@37.252.20.170 'tail -f /var/log/nginx/access.log'
```

## Повторный деплой

Если нужно обновить админку:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
./deploy-admin.sh
```

Nginx конфиг автоматически подхватит новые файлы.

---

**Дата:** 4 января 2026  
**Сервер:** 37.252.20.170 (Timeweb)  
**Домен:** api-rejuvena.duckdns.org
