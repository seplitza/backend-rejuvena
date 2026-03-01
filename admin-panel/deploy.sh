#!/bin/bash
set -e

echo "🔨 Building admin panel..."
npm run build

echo "📦 Creating archive..."
cd dist
tar czf ../dist.tar.gz *
cd ..

echo "⬆️  Uploading to production..."
scp dist.tar.gz root@37.252.20.170:/tmp/

echo "🚀 Deploying on production..."
ssh root@37.252.20.170 << 'EOF'
cd /var/www/rejuvena-backend/admin-panel/dist
rm -rf *
tar xzf /tmp/dist.tar.gz
rm /tmp/dist.tar.gz
echo "✅ Files extracted"
pm2 restart rejuvena-backend
echo "✅ Backend restarted"
EOF

echo "🎉 Deploy complete!"
echo "Don't forget to hard-refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)"
