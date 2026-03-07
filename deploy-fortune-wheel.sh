#!/bin/bash

echo "🚀 === REJUVENA FORTUNE WHEEL DEPLOYMENT ==="
echo ""

# Deployment package
DEPLOY_FILE="backend-deploy.tar.gz"

if [ ! -f "$DEPLOY_FILE" ]; then
    echo "❌ Ошибка: Файл $DEPLOY_FILE не найден"
    exit 1
fi

echo "📦 Package: $DEPLOY_FILE ($(ls -lh $DEPLOY_FILE | awk '{print $5}'))"
echo "🔑 Password: c+d2Ei@GeWWKq8"
echo ""
echo "=== ИНСТРУКЦИЯ ==="
echo ""
echo "1️⃣  Загрузите файл:"
echo "   scp backend-deploy.tar.gz root@37.252.20.170:/tmp/"
echo ""
echo "2️⃣  Подключитесь к серверу:"
echo "   ssh root@37.252.20.170"
echo ""
echo "3️⃣  На сервере выполните:"
echo ""
cat << 'EOF'
cd /var/www/rejuvena-backend
tar -xzf /tmp/backend-deploy.tar.gz
npm ci --production
pm2 restart rejuvena-backend
sleep 5
curl http://localhost:9527/health

# Создать 12 призов для колеса фортуны
curl -X POST http://localhost:9527/api/admin/fortune-wheel/seed-prizes \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTkxZGE3ZGRhNDczNzMzMmYzYTg1M2IiLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTc3MjE4NTcyNiwiZXhwIjoxNzcyNzkwNTI2fQ.AhfCB7VGkXVcv3b21sLbqpBru7ipc3qbxl-tzgoE3DY' \
  -H 'Content-Type: application/json'

# Проверить призы (должно быть 12)
curl http://localhost:9527/api/fortune-wheel/prizes | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"

# Выдать спины пользователям
mongosh mongodb://localhost:27017/rejuvena --eval 'db.users.updateMany({}, { $set: { fortuneWheelSpins: 3 } })'

exit
EOF

echo ""
echo "4️⃣  Проверьте с локальной машины:"
echo ""
echo "curl http://37.252.20.170:9527/api/fortune-wheel/prizes"
echo ""
echo "✅ Должно вернуть 12 призов!"
