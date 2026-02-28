#!/bin/bash

# Отладочный скрипт для проверки продакшн сервера

SERVER="root@37.252.20.170"
BACKEND_PATH="/var/www/rejuvena-backend"

echo "=== Проверка PM2 процессов ==="
ssh $SERVER "pm2 list"

echo ""
echo "=== PM2 логи rejuvena-backend (последние 50 строк) ==="
ssh $SERVER "pm2 logs rejuvena-backend --lines 50 --nostream"

echo ""
echo "=== Проверка .env файла ==="
ssh $SERVER "cd $BACKEND_PATH && ls -la .env* && echo '---' && head -20 .env"

echo ""
echo "=== Проверка подключения к MongoDB ==="
ssh $SERVER "mongo rejuvena --quiet --eval 'db.users.count()'"

echo ""
echo "=== Проверка health endpoint ==="
ssh $SERVER "curl -s http://localhost:9527/health"

echo ""
echo "=== Проверка admin login endpoint ==="
ssh $SERVER "curl -s -X POST http://localhost:9527/api/auth/admin/login -H 'Content-Type: application/json' -d '{\"email\":\"test\",\"password\":\"test\"}'"

echo ""
echo "=== Проверка Nginx статуса ==="
ssh $SERVER "systemctl status nginx | head -20"

echo ""
echo "=== Nginx логи ошибок (последние 20 строк) ==="
ssh $SERVER "tail -20 /var/log/nginx/error.log"
