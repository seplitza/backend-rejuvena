#!/bin/bash

# Тест боевых credentials Alfabank
# Проверяет подключение к боевому API

USERNAME="r-seplitza-api"
PASSWORD="D!ndA6U65Bx*bKq"
API_URL="https://payment.alfabank.ru/payment/rest"

echo "=== Testing Alfabank Production Credentials ==="
echo "API URL: $API_URL"
echo "Username: $USERNAME"
echo ""

# Тестовый запрос: получение статуса заказа (должен вернуть ошибку, но подтвердит что credentials работают)
echo "Testing connection..."
response=$(curl -s -X POST "$API_URL/getOrderStatusExtended.do" \
  -d "userName=$USERNAME" \
  -d "password=$PASSWORD" \
  -d "orderNumber=TEST-ORDER-123")

echo "Response:"
echo "$response" | jq . 2>/dev/null || echo "$response"
echo ""

# Проверка на ошибки авторизации
if echo "$response" | grep -q "errorCode.*5"; then
  echo "❌ AUTHENTICATION ERROR - Invalid credentials"
  exit 1
elif echo "$response" | grep -q "errorCode.*6"; then
  echo "✅ Credentials are VALID (order not found is expected)"
  echo "✅ Ready for production use!"
  exit 0
elif echo "$response" | grep -q "errorCode"; then
  echo "⚠️  API responded with error code:"
  echo "$response" | grep errorCode
  exit 1
else
  echo "✅ Connection successful!"
  exit 0
fi
