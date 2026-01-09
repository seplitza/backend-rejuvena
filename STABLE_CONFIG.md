# Текущая конфигурация системы (v1.0.0-stable)

**Дата создания:** 9 января 2026  
**Статус:** ✅ Рабочая конфигурация

---

## Admin Panel Configuration

### vite.config.ts
```typescript
base: '/admin/'
```

### App.tsx
```typescript
<Router basename="/admin">
```

### .env.production
```env
VITE_API_URL=https://api-rejuvena.duckdns.org/api
```

### API Client (src/api/client.ts)
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9527/api';
```

---

## Nginx Configuration

### Location: /etc/nginx/sites-available/rejuvena

```nginx
# Admin panel
location /admin/ {
    alias /var/www/rejuvena-backend/admin-panel/;
    try_files $uri $uri/ /admin/index.html;
    index index.html;
    
    types {
        text/html html;
        text/css css;
        application/javascript js;
        application/json json;
    }
}

# Redirect /admin to /admin/
location /admin {
    return 301 /admin/;
}

# API proxy
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
```

---

## Frontend Configuration (web)

### next.config.js
```javascript
const nextConfig = {
  output: 'export',
  basePath: '/rejuvena',
  assetPrefix: '/rejuvena/',
  images: {
    unoptimized: true,
  },
};
```

### src/config/api.ts
```typescript
const isProduction = process.env.NODE_ENV === 'production';

export const API_URL = isProduction 
  ? 'http://37.252.20.170:9527'
  : 'http://localhost:9527';

export const API_BASE_URL = `${API_URL}/api`;
```

---

## PM2 Configuration

### Backend Process
```bash
Name: rejuvena-backend
Mode: cluster
Port: 9527
Status: online
Uptime: 4D
```

### Restart Command
```bash
ssh root@37.252.20.170 "pm2 restart rejuvena-backend"
```

---

## Deploy Scripts

### Admin Panel Deploy (deploy-admin.sh)
```bash
#!/bin/bash
SERVER="37.252.20.170"
npm run build
tar -czf admin-deploy.tar.gz -C admin-panel/dist .
scp admin-deploy.tar.gz root@$SERVER:/tmp/
ssh root@$SERVER "cd /var/www/rejuvena-backend/admin-panel && tar -xzf /tmp/admin-deploy.tar.gz"
```

### Frontend Deploy
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run build
npm run export
npx gh-pages -d out
```

---

## URLs

- **Admin Panel:** https://api-rejuvena.duckdns.org/admin/
- **Frontend:** https://seplitza.github.io/rejuvena/exercises
- **API:** http://37.252.20.170:9527/api
- **Server:** 37.252.20.170

---

## Credentials (Default)

**Admin Panel:**
- Email: seplitza@gmail.com
- Password: 1234back

---

## Git Tags

**v1.0.0-stable** - Stable working version
- Admin panel с basename=/admin
- Production API URL configured
- Nginx config tested
- Frontend на GitHub Pages

---

## Rollback Instructions

Если что-то сломалось:

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git checkout v1.0.0-stable
./deploy-admin.sh
```

---

## Environment Variables

### Admin Panel
- `VITE_API_URL=https://api-rejuvena.duckdns.org/api`

### Backend
- `PORT=9527`
- `MONGODB_URI=<connection_string>`
- `JWT_SECRET=<secret>`

---

## Build Commands

### Admin Panel
```bash
cd admin-panel
VITE_API_URL=https://api-rejuvena.duckdns.org/api npm run build
```

### Frontend
```bash
cd web
npm run build
npm run export
```

---

## Health Check Commands

```bash
# Check admin panel
curl -I https://api-rejuvena.duckdns.org/admin/

# Check API
curl http://37.252.20.170:9527/api/health

# Check PM2
ssh root@37.252.20.170 "pm2 list"

# Check Nginx
ssh root@37.252.20.170 "systemctl status nginx"
```
