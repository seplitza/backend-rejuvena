#!/bin/bash

# Скрипт для импорта упражнений для шеи PRO
# Использование:
#   ./import-neck-pro.sh                    # Использует локальную MongoDB
#   ./import-neck-pro.sh production         # Нужно установить PROD_MONGODB_URI в .env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

if [ "$1" == "production" ]; then
    echo "🚀 Запуск импорта для PRODUCTION"
    echo "⚠️  Убедитесь, что PROD_MONGODB_URI установлен в .env файле"
    
    # Проверяем наличие PROD_MONGODB_URI
    if ! grep -q "PROD_MONGODB_URI" .env; then
        echo "❌ Ошибка: PROD_MONGODB_URI не найден в .env"
        echo "Добавьте строку:"
        echo "PROD_MONGODB_URI=mongodb://your-production-uri"
        exit 1
    fi
    
    # Временно меняем MONGODB_URI на PROD
    export MONGODB_URI=$(grep PROD_MONGODB_URI .env | cut -d '=' -f2-)
    
    echo "📡 Подключение к production базе..."
else
    echo "🔧 Запуск импорта для ЛОКАЛЬНОЙ базы"
fi

echo "▶️  Запуск скрипта импорта..."
npx ts-node src/scripts/import-neck-pro-manual.ts

echo "✅ Готово!"
