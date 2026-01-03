# Rejuvena Backend - Production

## 🚀 Deployment Info

**Server:** Timeweb Cloud  
**IP:** 37.252.20.170  
**Domain:** https://api-rejuvena.duckdns.org  
**SSH:** `ssh root@37.252.20.170`

## 📊 API Endpoints

### Public (no authentication)
- Health check: `GET /health`
- Exercises: `GET /api/exercises/public`
- Exercise by ID: `GET /api/exercises/public/:id`

### Admin (requires JWT token)
- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Exercises: `GET/POST/PUT/DELETE /api/exercises`
- Tags: `GET/POST/PUT/DELETE /api/tags`
- Media: `POST/DELETE /api/media`

## 🔑 Admin Credentials

**Email:** seplitza@gmail.com  
**Password:** 1234back

## 🛠️ Service Management

```bash
# PM2 (application)
pm2 status
pm2 logs rejuvena-backend
pm2 restart rejuvena-backend
pm2 stop rejuvena-backend

# MongoDB
systemctl status mongod
systemctl restart mongod
mongosh mongodb://localhost:27017/rejuvena

# Nginx
systemctl status nginx
systemctl restart nginx
nginx -t  # test config

# SSL Certificate (auto-renews)
certbot certificates
certbot renew --dry-run
```

## 📦 Database Stats

- **Exercises:** 35
- **Tags:** 7
- **Users:** 1

## 🔄 Update Deployment

```bash
# On local machine
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
npm run build
tar -czf backend-deploy.tar.gz dist/ package.json package-lock.json ecosystem.config.json
scp backend-deploy.tar.gz root@37.252.20.170:/tmp/

# On server
ssh root@37.252.20.170
cd /var/www/rejuvena-backend
tar -xzf /tmp/backend-deploy.tar.gz
npm ci --production
pm2 restart rejuvena-backend
```

## 📝 Database Backup/Restore

```bash
# Backup (on server)
mongodump --uri="mongodb://localhost:27017/rejuvena" --archive=/tmp/rejuvena-backup.gz --gzip

# Download backup
scp root@37.252.20.170:/tmp/rejuvena-backup.gz ./

# Restore (on server)
mongorestore --uri="mongodb://localhost:27017/rejuvena" --archive=/tmp/rejuvena-backup.gz --gzip --drop
```

## 🌐 Frontend Integration

Update frontend API URL to: `https://api-rejuvena.duckdns.org`

Example:
```typescript
const API_URL = 'https://api-rejuvena.duckdns.org/api';
const exercises = await fetch(`${API_URL}/exercises/public`).then(r => r.json());
```

## ✅ Status Check

```bash
# Test API
curl https://api-rejuvena.duckdns.org/health
curl https://api-rejuvena.duckdns.org/api/exercises/public

# Check services
pm2 status
systemctl status mongod nginx
```

## 🔒 SSL Certificate

- **Issuer:** Let's Encrypt
- **Expires:** 2026-04-03
- **Auto-renewal:** Enabled (via certbot timer)
