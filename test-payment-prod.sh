#!/bin/bash

echo "🧪 Тестирование Payment API на продакшн сервере"
echo "================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="https://api-rejuvena.duckdns.org"

# Получаем список пользователей
echo "1️⃣ Получаем список пользователей..."
ssh root@37.252.20.170 'cd /var/www/rejuvena-backend && npx tsx -e "
import mongoose from \"mongoose\";
import User from \"./src/models/User.model.js\";

async function getUsers() {
  await mongoose.connect(\"mongodb://localhost:27017/rejuvena\");
  const users = await User.find().select(\"email _id\");
  console.log(\"Пользователи:\");
  users.forEach(u => console.log(\`  - \${u.email} (ID: \${u._id})\`));
  await mongoose.connection.close();
}
getUsers();
"'

echo ""
echo "2️⃣ Тестирование эндпоинта /api/payment/create (без авторизации)..."
RESPONSE=$(curl -s -X POST "$API_URL/api/payment/create" \
  -H "Content-Type: application/json" \
  -d '{"amount":990,"description":"Test","planType":"premium","duration":30}')

if echo "$RESPONSE" | grep -q "error"; then
  echo -e "${GREEN}✅ Ожидаемая ошибка: требуется авторизация${NC}"
  echo "   Ответ: $RESPONSE"
else
  echo -e "${RED}❌ Неожиданный ответ${NC}"
  echo "   Ответ: $RESPONSE"
fi

echo ""
echo "3️⃣ Проверка структуры базы данных..."
ssh root@37.252.20.170 'cd /var/www/rejuvena-backend && npx tsx -e "
import mongoose from \"mongoose\";

async function checkDB() {
  await mongoose.connect(\"mongodb://localhost:27017/rejuvena\");
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(\"Коллекции в базе:\");
  collections.forEach(c => console.log(\`  - \${c.name}\`));
  
  const paymentsExists = collections.some(c => c.name === \"payments\");
  if (paymentsExists) {
    const count = await mongoose.connection.db.collection(\"payments\").countDocuments();
    console.log(\`\\nВ коллекции payments: \${count} документов\`);
  } else {
    console.log(\"\\n⚠️  Коллекция payments еще не создана (это нормально до первого платежа)\");
  }
  
  await mongoose.connection.close();
}
checkDB();
"'

echo ""
echo "4️⃣ Проверка доступности роутов..."
echo "   GET /api/payment/history"
curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" "$API_URL/api/payment/history"

echo ""
echo "✅ Тестирование завершено!"
echo ""
echo "📋 Для полного теста нужно:"
echo "   1. Создать пользователя через регистрацию"
echo "   2. Получить токен авторизации"
echo "   3. Вызвать POST /api/payment/create с токеном"
echo "   4. Открыть полученный paymentUrl в браузере"
