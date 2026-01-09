#!/bin/bash

# 🧪 Скрипт быстрого тестирования премиум-функционала

echo "🧪 Тестирование премиум-функционала Rejuvena"
echo "=============================================="
echo ""

# Проверка что сервер запущен
echo "1️⃣ Проверка серверов..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend сервер запущен (http://localhost:3000)"
else
    echo "   ❌ Frontend сервер НЕ запущен"
    echo "   Запустите: cd /Users/alexeipinaev/Documents/Rejuvena/web && npx serve@latest out -l 3000"
    exit 1
fi

if curl -s http://localhost:9527/api/exercises/public > /dev/null; then
    echo "   ✅ Backend API доступен (http://localhost:9527)"
else
    echo "   ❌ Backend API недоступен"
    echo "   Запустите: cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena && npm start"
    exit 1
fi

echo ""

# Статистика упражнений
echo "2️⃣ Статистика упражнений из API..."
curl -s http://localhost:9527/api/exercises/public | python3 -c "
import sys, json
exercises = json.loads(sys.stdin.read())
free = sum(1 for e in exercises if any(t['name'] in ['Бесплатное', 'На осанку'] for t in e.get('tags', [])))
basic = sum(1 for e in exercises if any('Базовое' == t['name'] or 'Платное базовое' == t['name'] for t in e.get('tags', [])))
pro = sum(1 for e in exercises if any('продвинутое' == t['name'] or 'PRO' == t['name'] for t in e.get('tags', [])))
print(f'   📊 Всего: {len(exercises)}')
print(f'   🟢 Бесплатных: {free}')
print(f'   🔵 Базовых (100₽): {basic}')
print(f'   🟣 PRO (200₽): {pro}')
"

echo ""

# Примеры упражнений
echo "3️⃣ Примеры упражнений по категориям..."
curl -s http://localhost:9527/api/exercises/public | python3 -c "
import sys, json
exercises = json.loads(sys.stdin.read())

# Бесплатное
free = [e for e in exercises if any(t['name'] in ['Бесплатное', 'На осанку'] for t in e.get('tags', []))][:1]
if free:
    print(f'   🟢 Бесплатное: {free[0][\"title\"]}')
    print(f'      ID: {free[0][\"_id\"]}')

# Базовое
basic = [e for e in exercises if any('Базовое' == t['name'] for t in e.get('tags', []))][:1]
if basic:
    print(f'   🔵 Базовое: {basic[0][\"title\"]}')
    print(f'      ID: {basic[0][\"_id\"]}')

# PRO
pro = [e for e in exercises if any('PRO' == t['name'] for t in e.get('tags', []))][:1]
if pro:
    print(f'   🟣 PRO: {pro[0][\"title\"]}')
    print(f'      ID: {pro[0][\"_id\"]}')
"

echo ""

# Тестовые команды
echo "4️⃣ Команды для тестирования в браузере:"
echo ""
echo "   📱 Открыть страницу упражнений:"
echo "      http://localhost:3000/exercises"
echo ""
echo "   🔍 Проверить localStorage (в консоли браузера):"
echo "      localStorage.getItem('purchased_exercises')"
echo ""
echo "   💳 Симулировать покупку (в консоли браузера):"
echo "      const id = '677bfab32bc71f5f7fd99e8b'; // Замените на реальный ID"
echo "      const purchased = JSON.parse(localStorage.getItem('purchased_exercises') || '[]');"
echo "      purchased.push(id);"
echo "      localStorage.setItem('purchased_exercises', JSON.stringify(purchased));"
echo "      location.reload();"
echo ""
echo "   🗑️ Очистить покупки:"
echo "      localStorage.removeItem('purchased_exercises');"
echo "      location.reload();"
echo ""

# Проверка файлов
echo "5️⃣ Проверка важных файлов..."
files=(
    "/Users/alexeipinaev/Documents/Rejuvena/web/src/components/PaymentModal.tsx"
    "/Users/alexeipinaev/Documents/Rejuvena/web/src/utils/exerciseAccess.ts"
    "/Users/alexeipinaev/Documents/Rejuvena/web/src/pages/exercises.tsx"
    "/Users/alexeipinaev/Documents/Rejuvena/web/src/pages/exercise/[exerciseId].tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $(basename $file)"
    else
        echo "   ❌ $(basename $file) НЕ НАЙДЕН"
    fi
done

echo ""
echo "=============================================="
echo "✅ Проверка завершена!"
echo ""
echo "📚 Документация:"
echo "   - DEPLOYMENT-REPORT.md"
echo "   - INTEGRATION_GUIDE.md"
echo "   - test-integration.md"
echo "   - BUGFIXES.md"
echo ""
