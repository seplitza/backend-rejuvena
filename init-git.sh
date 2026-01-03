#!/bin/bash

echo "🚀 Инициализация Git репозитория для Rejuvena Backend"
echo ""

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    echo "   Запустите скрипт из корневой папки проекта"
    exit 1
fi

# Инициализация git
echo "📦 Инициализация Git..."
git init

# Добавление всех файлов
echo "📝 Добавление файлов..."
git add .

# Первый коммит
echo "💾 Создание первого коммита..."
git commit -m "Initial commit: Rejuvena Backend & Admin Panel

Features:
- Backend API (Node.js + Express + TypeScript)
- MongoDB models (User, Exercise, Tag)
- JWT authentication
- Media upload with optimization
- Admin Panel (React + TypeScript + Vite)
- TipTap rich text editor
- Drag & Drop media management
- Tag system
- Exercise CRUD operations

Tech Stack:
- Backend: Node.js, Express, TypeScript, MongoDB, JWT
- Frontend: React, TypeScript, Vite, TipTap, dnd-kit
- Database: MongoDB
"

echo ""
echo "✅ Git репозиторий инициализирован!"
echo ""
echo "📝 Следующие шаги:"
echo ""
echo "1. Создайте репозиторий на GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Назовите его: backend-rejuvena"
echo ""
echo "3. НЕ создавайте README, .gitignore (они уже есть)"
echo ""
echo "4. Подключите remote и запушьте:"
echo "   git remote add origin https://github.com/seplitza/backend-rejuvena.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "5. Разверните на продакшн (см. DEPLOYMENT.md):"
echo "   - Backend → Railway/Render/Heroku"
echo "   - Admin Panel → GitHub Pages/Vercel"
echo "   - Database → MongoDB Atlas"
echo ""
echo "📚 Документация:"
echo "   - QUICKSTART.md  - Быстрый старт"
echo "   - SETUP.md       - Подробная документация"
echo "   - DEPLOYMENT.md  - Развертывание"
echo ""
