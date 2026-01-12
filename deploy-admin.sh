#!/bin/bash

# Rejuvena Admin Panel - Deployment Script for Timeweb Cloud
# Usage: ./deploy-admin.sh

SERVER_IP="37.252.20.170"
SERVER_USER="root"
APP_DIR="/var/www/rejuvena-backend"
ADMIN_DIR="$APP_DIR/admin-panel"

echo "🚀 Deploying Rejuvena Admin Panel to Timeweb Cloud"
echo "Server: $SERVER_IP"

# Build admin panel
echo "📦 Building admin panel..."
cd admin-panel

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build for production
NODE_ENV=production npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd ..
tar -czf admin-deploy.tar.gz -C admin-panel/dist .

# Upload to server
echo "📤 Uploading to server..."
scp admin-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Setup on server
echo "🔧 Setting up on server..."
ssh $SERVER_USER@$SERVER_IP << EOF
  # Create admin directory
  mkdir -p $ADMIN_DIR
  
  # Extract package
  cd $ADMIN_DIR
  tar -xzf /tmp/admin-deploy.tar.gz
  rm /tmp/admin-deploy.tar.gz
  
  # Set permissions
  chown -R www-data:www-data $ADMIN_DIR
  
  echo "✅ Admin panel deployed to: $ADMIN_DIR"
EOF

# Cleanup
rm admin-deploy.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Admin panel URL: https://api-rejuvena.duckdns.org/admin"
echo ""
echo "Next steps:"
echo "1. Update nginx config to serve admin panel"
echo "2. Restart nginx: ssh root@$SERVER_IP 'systemctl restart nginx'"
