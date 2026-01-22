#!/bin/bash
set -e

echo "🎓 Создание Rejuvena Old App..."
echo ""

# Проверка что мы в правильной директории
if [ ! -d "/Users/alexeipinaev/Documents/Rejuvena" ]; then
  echo "❌ Директория /Users/alexeipinaev/Documents/Rejuvena не найдена"
  exit 1
fi

cd /Users/alexeipinaev/Documents/Rejuvena

# Проверить существует ли уже Rejuvena_old_app
if [ -d "Rejuvena_old_app" ]; then
  echo "⚠️  Директория Rejuvena_old_app уже существует"
  read -p "Удалить и пересоздать? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf Rejuvena_old_app
  else
    echo "❌ Отменено"
    exit 1
  fi
fi

echo "1️⃣  Клонирование репозитория rejuvena..."
git clone https://github.com/seplitza/rejuvena.git Rejuvena_old_app

cd Rejuvena_old_app

echo "2️⃣  Откат к версии 1.1.0 (с Azure курсами)..."
git checkout v1.1.0-stable

echo "3️⃣  Удаление старого remote..."
git remote remove origin

echo "4️⃣  Проверка существования репозитория на GitHub..."
echo "⚠️  ВАЖНО: Создайте репозиторий на GitHub:"
echo "   https://github.com/seplitza/Rejuvena_old_app"
echo ""
read -p "Нажмите Enter когда репозиторий будет создан..."

echo "5️⃣  Добавление нового remote..."
git remote add origin https://github.com/seplitza/Rejuvena_old_app.git

echo "6️⃣  Обновление package.json..."
# Обновить name
sed -i '' 's/"name": "rejuvena"/"name": "rejuvena-old-app"/' package.json

# Обновить homepage
sed -i '' 's|"homepage": "https://seplitza.github.io/rejuvena"|"homepage": "https://seplitza.github.io/Rejuvena_old_app"|' package.json

echo "7️⃣  Обновление next.config.js..."
cat > next.config.js << 'NEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: process.env.NODE_ENV === 'production' ? '/Rejuvena_old_app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Rejuvena_old_app' : '',
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
NEXTCONFIG

echo "8️⃣  Проверка .env.production..."
if [ -f ".env.production" ]; then
  echo "✅ .env.production найден:"
  cat .env.production
else
  echo "⚠️  .env.production не найден, создаю..."
  cat > .env.production << 'ENVPROD'
# OLD Backend (Azure) - for auth and courses
NEXT_PUBLIC_API_URL=https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net

# NEW Backend (DuckDNS) - for exercises only
NEXT_PUBLIC_NEW_API_URL=https://api-rejuvena.duckdns.org
ENVPROD
fi

echo "9️⃣  Создание GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'WORKFLOW'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
          cname: false
WORKFLOW

echo "🔟 Первый коммит..."
git add -A
git commit -m "Initial commit: Rejuvena Old App v1.1.0 with Azure courses"

echo "1️⃣1️⃣  Push в GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Rejuvena Old App создан!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Зайти в https://github.com/seplitza/Rejuvena_old_app/settings/pages"
echo "2. Source: выбрать 'gh-pages' branch"
echo "3. Сохранить"
echo ""
echo "После этого сайт будет доступен на:"
echo "🌐 https://seplitza.github.io/Rejuvena_old_app/"
echo ""
echo "Для локального тестирования:"
echo "  cd /Users/alexeipinaev/Documents/Rejuvena/Rejuvena_old_app"
echo "  npm run dev"
echo ""
