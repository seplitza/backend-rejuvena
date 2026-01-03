#!/bin/bash
# Скрипт настройки сервера Rejuvena Backend
# Запускать на сервере: bash setup-server.sh

set -e

echo "🚀 Настройка Rejuvena Backend на сервере..."

# Обновление системы
echo "📦 Обновление системы..."
apt-get update
apt-get upgrade -y

# Установка Node.js 18.x
if ! command -v node &> /dev/null; then
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Установка MongoDB
if ! command -v mongod &> /dev/null; then
    echo "📦 Установка MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
fi

echo "✅ MongoDB установлен"

# Установка PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2..."
    npm install -g pm2
fi

echo "✅ PM2 version: $(pm2 --version)"

# Установка Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Установка Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
fi

echo "✅ Nginx установлен"

# Установка Certbot для SSL
if ! command -v certbot &> /dev/null; then
    echo "📦 Установка Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi

echo "✅ Certbot установлен"

# Создание директории приложения
echo "📁 Создание директории приложения..."
mkdir -p /var/www/rejuvena-backend
cd /var/www/rejuvena-backend

# Распаковка архива
echo "📦 Распаковка приложения..."
tar -xzf /tmp/backend-deploy.tar.gz
rm /tmp/backend-deploy.tar.gz

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm ci --production

# Настройка .env
if [ ! -f .env ]; then
    echo "⚙️  Создание .env файла..."
    cp .env.production.example .env
    
    # Генерация JWT секрета
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/g" .env
    
    echo "✅ .env файл создан"
fi

# Создание директории для логов
mkdir -p logs

# Настройка Nginx
echo "⚙️  Настройка Nginx..."
cp nginx.conf /etc/nginx/sites-available/rejuvena-backend
ln -sf /etc/nginx/sites-available/rejuvena-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации Nginx
nginx -t

# Перезапуск Nginx
systemctl restart nginx

echo "✅ Nginx настроен"

# Запуск приложения с PM2
echo "🚀 Запуск приложения..."
pm2 delete rejuvena-backend 2>/dev/null || true
pm2 start ecosystem.config.json
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Базовая настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. DNS уже настроен: api-rejuvena.duckdns.org -> 37.252.20.170"
echo "2. Установите SSL: certbot --nginx -d api-rejuvena.duckdns.org --non-interactive --agree-tos -m seplitza@gmail.com"
echo ""
echo "📍 Полезные команды:"
echo "  pm2 status          - статус приложения"
echo "  pm2 logs            - логи приложения"
echo "  pm2 restart all     - перезапуск"
echo "  systemctl status nginx  - статус Nginx"
echo ""
