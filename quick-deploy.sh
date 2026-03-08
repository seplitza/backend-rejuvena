#!/bin/bash

echo "🚀 Deploying Backend Fix..."

sshpass -p 'c+d2Ei@GeWWKq8' ssh -o StrictHostKeyChecking=no root@37.252.20.170 << 'ENDSSH'
cd /var/www/rejuvena-backend
echo "📁 Current directory: $(pwd)"
echo "📥 Pulling latest code..."
git pull origin main
echo "🔨 Building..."
npm run build
echo "♻️ Restarting PM2..."
pm2 restart rejuvena-backend
echo "✅ Deployment complete!"
pm2 list | grep rejuvena
ENDSSH

echo "✅ Done!"
