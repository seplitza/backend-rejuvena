#!/bin/bash

# Тест боевой оплаты Alfabank (Production)
# Проверяет создание платежа через продакшен API

API_URL="http://37.252.20.170:9527"
TEST_USER_EMAIL="payment-test@rejuvena.com"
TEST_USER_PASSWORD="Test1234!"

echo "=== Alfabank Production Payment Test ==="
echo "API URL: $API_URL"
echo "User: $TEST_USER_EMAIL"
echo ""

# Шаг 1: Логин
echo "Step 1: Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Шаг 2: Создание платежа
echo "Step 2: Create payment (test amount: 1 RUB)..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/payment/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 1,
    "description": "Test Premium Payment",
    "planType": "premium",
    "duration": 30
  }')

echo "Payment Response:"
echo "$PAYMENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PAYMENT_RESPONSE"
echo ""

# Извлечение paymentUrl
PAYMENT_URL=$(echo "$PAYMENT_RESPONSE" | grep -o '"paymentUrl":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PAYMENT_URL" ]; then
  echo "✅ Payment created successfully!"
  echo ""
  echo "🔗 Payment URL:"
  echo "$PAYMENT_URL"
  echo ""
  echo "Copy this URL to browser to complete payment"
  echo ""
  echo "Test Cards:"
  echo "  Success: 4111 1111 1111 1111 (any CVV, future date)"
  echo "  Decline: 4000 0000 0000 0002"
else
  echo "❌ Payment creation failed!"
  echo "Check response above for errors"
  exit 1
fi
