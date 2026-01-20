#!/bin/bash

# Marathon Payment Testing Script
# Tests payment creation and enrollment flow for marathons

echo "🏃 Marathon Payment Flow Test"
echo "=============================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:9527}"
TEST_USER_EMAIL="test@marathon.com"
TEST_USER_PASSWORD="testpass123"
MARATHON_NAME="Test Marathon"

echo "📍 API URL: $API_URL"
echo ""

# Step 1: Login or Register
echo "1️⃣ Authenticating test user..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "   ❌ Login failed, trying registration..."
  
  REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\"}")
  
  TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo "   ❌ Registration failed"
    echo "   Response: $REGISTER_RESPONSE"
    exit 1
  fi
  
  echo "   ✅ User registered successfully"
else
  echo "   ✅ User logged in successfully"
fi

echo "   🔑 Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get list of marathons
echo "2️⃣ Fetching available marathons..."
MARATHONS_RESPONSE=$(curl -s "$API_URL/api/marathons")

# Extract first marathon ID and details
MARATHON_ID=$(echo $MARATHONS_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
MARATHON_TITLE=$(echo $MARATHONS_RESPONSE | grep -o '"title":"[^"]*' | head -1 | cut -d'"' -f4)
MARATHON_COST=$(echo $MARATHONS_RESPONSE | grep -o '"cost":[0-9]*' | head -1 | cut -d':' -f2)
IS_PAID=$(echo $MARATHONS_RESPONSE | grep -o '"isPaid":[a-z]*' | head -1 | cut -d':' -f2)

if [ -z "$MARATHON_ID" ]; then
  echo "   ❌ No marathons found"
  echo "   Response: $MARATHONS_RESPONSE"
  echo ""
  echo "   💡 Create a marathon in admin panel first:"
  echo "      - Go to http://localhost:9527/admin/marathons"
  echo "      - Create a test marathon"
  echo "      - Set isDisplay = true, isPublic = true"
  exit 1
fi

echo "   ✅ Found marathon:"
echo "      ID: $MARATHON_ID"
echo "      Title: $MARATHON_TITLE"
echo "      Cost: $MARATHON_COST ₽"
echo "      Paid: $IS_PAID"
echo ""

# Step 3: Try to enroll (free) or create payment (paid)
if [ "$IS_PAID" = "true" ] || [ "$MARATHON_COST" -gt 0 ]; then
  echo "3️⃣ Creating payment for paid marathon..."
  
  PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/payment/create-marathon" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"marathonId\":\"$MARATHON_ID\",\"marathonName\":\"$MARATHON_TITLE\",\"price\":$MARATHON_COST}")
  
  PAYMENT_URL=$(echo $PAYMENT_RESPONSE | grep -o '"paymentUrl":"[^"]*' | cut -d'"' -f4)
  ORDER_NUMBER=$(echo $PAYMENT_RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$PAYMENT_URL" ]; then
    echo "   ❌ Payment creation failed"
    echo "   Response: $PAYMENT_RESPONSE"
    exit 1
  fi
  
  echo "   ✅ Payment created successfully"
  echo "      Order Number: $ORDER_NUMBER"
  echo "      Payment URL: $PAYMENT_URL"
  echo ""
  echo "   💳 Next steps (manual):"
  echo "      1. Open payment URL in browser"
  echo "      2. Use test card: 5555555555554444"
  echo "      3. Expiry: 12/29, CVV: 123"
  echo "      4. After payment, check enrollment with:"
  echo "         curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/marathons/$MARATHON_ID/progress"
  
else
  echo "3️⃣ Enrolling in free marathon..."
  
  ENROLL_RESPONSE=$(curl -s -X POST "$API_URL/api/marathons/$MARATHON_ID/enroll" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  ENROLLMENT_STATUS=$(echo $ENROLL_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$ENROLLMENT_STATUS" ]; then
    ERROR_MSG=$(echo $ENROLL_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ERROR_MSG" ]; then
      echo "   ⚠️  $ERROR_MSG"
    else
      echo "   ❌ Enrollment failed"
      echo "   Response: $ENROLL_RESPONSE"
    fi
  else
    echo "   ✅ Enrollment successful"
    echo "      Status: $ENROLLMENT_STATUS"
  fi
  echo ""
fi

# Step 4: Check user progress
echo "4️⃣ Checking enrollment progress..."
PROGRESS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/marathons/$MARATHON_ID/progress")

CURRENT_DAY=$(echo $PROGRESS_RESPONSE | grep -o '"currentDay":[0-9]*' | cut -d':' -f2)
COMPLETED_DAYS=$(echo $PROGRESS_RESPONSE | grep -o '"completedDays":\[[^\]]*\]' | cut -d':' -f2)
ENROLLMENT_STATUS=$(echo $PROGRESS_RESPONSE | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$ENROLLMENT_STATUS" ]; then
  echo "   ✅ Enrollment found:"
  echo "      Status: $ENROLLMENT_STATUS"
  echo "      Current Day: ${CURRENT_DAY:-1}"
  echo "      Completed Days: ${COMPLETED_DAYS:-[]}"
else
  echo "   ℹ️  No enrollment yet (expected if payment not completed)"
fi
echo ""

# Step 5: Try to access first day
echo "5️⃣ Testing day access..."
DAY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/marathons/$MARATHON_ID/day/1")

DAY_NUMBER=$(echo $DAY_RESPONSE | grep -o '"dayNumber":[0-9]*' | cut -d':' -f2)
ERROR_MSG=$(echo $DAY_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4)

if [ -n "$DAY_NUMBER" ]; then
  echo "   ✅ Day 1 accessible"
  EXERCISES_COUNT=$(echo $DAY_RESPONSE | grep -o '"exercises":\[' | wc -l)
  echo "      Day Number: $DAY_NUMBER"
  echo "      Exercises: $EXERCISES_COUNT"
elif [ -n "$ERROR_MSG" ]; then
  echo "   ⚠️  Access denied: $ERROR_MSG"
  echo "      (Expected if not enrolled or day locked)"
else
  echo "   ❌ Day access failed"
  echo "   Response: ${DAY_RESPONSE:0:200}..."
fi
echo ""

# Summary
echo "=============================="
echo "✅ Test completed"
echo ""
echo "📊 Summary:"
echo "   • Marathon ID: $MARATHON_ID"
echo "   • Marathon Title: $MARATHON_TITLE"
echo "   • Cost: $MARATHON_COST ₽"
echo "   • Token: Valid ✅"
echo ""

if [ "$IS_PAID" = "true" ]; then
  echo "💡 To complete enrollment:"
  echo "   1. Complete payment via URL above"
  echo "   2. Re-run this script to verify enrollment"
else
  echo "✅ Free marathon enrollment should be complete"
fi

echo ""
