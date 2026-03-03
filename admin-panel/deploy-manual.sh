#!/bin/bash

# Deploy admin panel to server
# Run this script manually if automated deployment fails

echo "📦 Deploying admin panel to production..."

# Build the project
echo "🔨 Building..."
cd "$(dirname "$0")"
npm run build

# Create archive
echo "📂 Creating archive..."
cd dist
tar czf admin.tar.gz *

# Upload to server
echo "📤 Uploading to server..."
scp admin.tar.gz root@37.252.20.170:/tmp/

# Deploy on server
echo "🚀 Deploying on server..."
ssh root@37.252.20.170 << 'EOF'
cd /var/www/admin-panel
rm -rf *
tar xzf /tmp/admin.tar.gz
rm /tmp/admin.tar.gz
echo "✅ Deployment complete!"
EOF

echo "✅ Admin panel deployed successfully!"
