#!/bin/bash

# Rejuvena Backend - Deployment Script for Timeweb Cloud
# Usage: ./deploy.sh <server-ip> <domain>

SERVER_IP=$1
DOMAIN=$2
SERVER_USER="root"
APP_DIR="/var/www/rejuvena-backend"

echo "🚀 Deploying Rejuvena Backend to Timeweb Cloud"
echo "Server: $SERVER_IP"
echo "Domain: $DOMAIN"

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf backend-deploy.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  .env.production.example \
  ecosystem.config.json

# Upload to server
echo "📤 Uploading to server..."
scp backend-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Setup on server
echo "🔧 Setting up on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
  # Install Node.js if not installed
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
  fi

  # Install MongoDB if not installed
  if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
  fi

  # Install PM2 if not installed
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
  fi

  # Create app directory
  mkdir -p /var/www/rejuvena-backend
  cd /var/www/rejuvena-backend

  # Extract package
  tar -xzf /tmp/backend-deploy.tar.gz
  rm /tmp/backend-deploy.tar.gz

  # Install dependencies
  npm ci --production

  # Setup environment
  if [ ! -f .env ]; then
    cp .env.production.example .env
    echo "⚠️  Please edit /var/www/rejuvena-backend/.env with your production values"
  fi

  # Create logs directory
  mkdir -p logs

  # Start with PM2
  pm2 delete rejuvena-backend || true
  pm2 start ecosystem.config.json
  pm2 save
  pm2 startup

  echo "✅ Backend deployed successfully!"
  echo "📍 Running on port 9527"
  echo "🔧 Configure Nginx reverse proxy for domain: $DOMAIN"
EOF

# Cleanup
rm backend-deploy.tar.gz

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. SSH to server: ssh root@$SERVER_IP"
echo "2. Edit .env file: nano /var/www/rejuvena-backend/.env"
echo "3. Restart backend: pm2 restart rejuvena-backend"
echo "4. Setup Nginx reverse proxy"
echo "5. Install SSL certificate with certbot"
