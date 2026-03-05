#!/bin/bash

# Деплой обновлений системы комментариев
# Запускать из Backend-rejuvena/

set -e  # Остановить при ошибке

echo "🚀 Начинаем деплой обновлений комментариев..."

# 1. Backend
echo "📦 Обновляем Backend..."
npm run build

echo "🔄 Перезапускаем Backend сервер..."
pm2 restart rejuvena-backend || npm run start:prod &

# 2. Admin Panel
echo "🎨 Обновляем Admin Panel..."
cd admin-panel
npm run build

echo "📤 Деплоим Admin Panel..."
./deploy.sh || echo "⚠️ Запустите deploy.sh вручную"

cd ..

echo "✅ Деплой завершен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте работу админки: https://your-admin-url.com/comments"
echo "2. Протестируйте вкладки и фильтры"
echo "3. Попробуйте поставить звездочку на комментарий"
echo "4. Проверьте сортировку в мобильном приложении"
