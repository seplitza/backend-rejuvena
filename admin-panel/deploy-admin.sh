#!/bin/bash
set -e

# Admin Panel Deployment Script
# This script builds and deploys the admin panel to production

echo "🚀 Admin Panel Deployment Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ADMIN_PANEL_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_IP="37.252.20.170"
SERVER_USER="root"
DEPLOY_PATH="/var/www/rejuvena-admin"
BACKUP_PATH="/var/backups/admin-panel"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Server: $SERVER_IP"
echo "  Deploy Path: $DEPLOY_PATH"
echo "  Backup Path: $BACKUP_PATH"
echo ""

# Step 1: Build admin panel
echo -e "${YELLOW}Step 1: Building admin panel...${NC}"
cd "$ADMIN_PANEL_DIR"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Create archive
echo -e "${YELLOW}Step 2: Creating deployment archive...${NC}"
cd "$ADMIN_PANEL_DIR/dist"
DEPLOY_ARCHIVE="/tmp/admin-panel-$(date +%Y%m%d_%H%M%S).tar.gz"
tar czf "$DEPLOY_ARCHIVE" *
echo -e "${GREEN}✅ Archive created: $DEPLOY_ARCHIVE${NC}"
echo ""

# Step 3: Create backup on server
echo -e "${YELLOW}Step 3: Creating backup on server...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << 'BACKUP_SCRIPT'
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/admin-panel"
mkdir -p $BACKUP_DIR

cd /var/www/rejuvena-admin
if [ -f index.html ]; then
  tar czf $BACKUP_DIR/admin-panel-${BACKUP_DATE}.tar.gz * .* 2>/dev/null || true
  echo "✅ Backup created: $BACKUP_DIR/admin-panel-${BACKUP_DATE}.tar.gz"
  
  # Keep only last 5 backups
  cd $BACKUP_DIR
  ls -t admin-panel-*.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null || true
fi
BACKUP_SCRIPT
echo -e "${GREEN}✅ Backup complete${NC}"
echo ""

# Step 4: Upload archive to server
echo -e "${YELLOW}Step 4: Uploading archive to server...${NC}"
scp "$DEPLOY_ARCHIVE" "$SERVER_USER@$SERVER_IP:/tmp/"
echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Step 5: Deploy on server
echo -e "${YELLOW}Step 5: Deploying on server...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << DEPLOY_SCRIPT
cd $DEPLOY_PATH
echo "Extracting archive..."
tar xzf /tmp/$(basename $DEPLOY_ARCHIVE)
rm /tmp/$(basename $DEPLOY_ARCHIVE)
echo "✅ Files deployed"
echo ""
echo "New admin panel files:"
ls -lah index.html assets/ vite.svg 2>/dev/null | head -10
DEPLOY_SCRIPT
echo -e "${GREEN}✅ Deployment complete${NC}"
echo ""

# Step 6: Cleanup
rm "$DEPLOY_ARCHIVE"
echo -e "${YELLOW}Step 6: Cleanup${NC}"
echo -e "${GREEN}✅ Temporary files cleaned${NC}"
echo ""

echo -e "${GREEN}🎉 Admin panel deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open admin panel in browser: https://api-rejuvena.duckdns.org/admin"
echo "2. Hard-refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)"
echo "3. Test the new features"
echo ""
echo -e "${YELLOW}To rollback if there are issues:${NC}"
echo "  bash rollback-admin.sh"
