#!/bin/bash
# Простая загрузка файла через терминал

PASSWORD="c+d2Ei@GeWWKq8"
SERVER="37.252.20.170"
FILE="backend-deploy.tar.gz"

echo "🚀 Автоматический deployment Fortune Wheel"
echo ""

# Использую expect для автоматизации
/usr/bin/expect << EXPECT_SCRIPT
set timeout 300

# Upload file
spawn scp -o StrictHostKeyChecking=no $FILE root@$SERVER:/tmp/
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
}

puts "\n✅ Файл загружен\n"

# Connect and deploy
spawn ssh -o StrictHostKeyChecking=no root@$SERVER
expect {
    "password:" {
        send "$PASSWORD\r"
    }
}

# Wait for prompt
expect {
    "#" { }
    "$" { }
}

send "cd /var/www/rejuvena-backend\r"
expect "#"

send "tar -xzf /tmp/backend-deploy.tar.gz\r"
expect "#"

send "npm ci --production 2>&1 | tail -3\r"
expect "#" timeout 120

send "pm2 restart rejuvena-backend\r"
expect "#"

send "sleep 5\r"
expect "#"

send "curl -s http://localhost:9527/health | python3 -m json.tool\r"
expect "#"

send "curl -X POST http://localhost:9527/api/admin/fortune-wheel/seed-prizes -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTkxZGE3ZGRhNDczNzMzMmYzYTg1M2IiLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTc3MjE4NTcyNiwiZXhwIjoxNzcyNzkwNTI2fQ.AhfCB7VGkXVcv3b21sLbqpBru7ipc3qbxl-tzgoE3DY' -H 'Content-Type: application/json' 2>&1\r"
expect "#"

send "curl -s http://localhost:9527/api/fortune-wheel/prizes 2>&1 | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))'\r"
expect "#"

send "exit\r"
expect eof

EXPECT_SCRIPT

echo ""
echo "✅ Deployment завершен!"
echo ""
echo "Проверка с локального компьютера..."
curl -s http://37.252.20.170:9527/api/fortune-wheel/prizes 2>&1 | python3 -c "import json,sys; data=json.load(sys.stdin); print(f'\n🎰 Призов создано: {len(data)}')" 2>/dev/null || echo "⚠️  Не удалось проверить"
