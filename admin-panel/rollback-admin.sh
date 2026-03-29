#!/bin/bash
set -e

# Admin Panel Rollback Script
# This script rolls back the admin panel to a previous version

echo "⏮️  Admin Panel Rollback Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="37.252.20.170"
SERVER_USER="root"
DEPLOY_PATH="/var/www/rejuvena-admin"
BACKUP_PATH="/var/backups/admin-panel"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Server: $SERVER_IP"
echo "  Backup Path: $BACKUP_PATH"
echo ""

# Step 1: List available backups
echo -e "${YELLOW}Step 1: Available backups:${NC}"
ssh "$SERVER_USER@$SERVER_IP" "ls -lh $BACKUP_PATH/admin-panel-*.tar.gz 2>/dev/null || echo 'No backups found'"
echo ""

# Step 2: Detect latest backup
echo -e "${YELLOW}Step 2: Detecting latest backup...${NC}"
LATEST_BACKUP=$(ssh "$SERVER_USER@$SERVER_IP" "ls -t $BACKUP_PATH/admin-panel-*.tar.gz 2>/dev/null | head -1 || echo ''")

if [ -z "$LATEST_BACKUP" ]; then
  echo -e "${RED}❌ No backups found!${NC}"
  echo "Cannot rollback. There are no previous versions to restore."
  exit 1
fi

echo -e "${YELLOW}Latest backup: ${NC}$LATEST_BACKUP"
echo ""

# Step 3: Confirm rollback
echo -e "${RED}⚠️  WARNING: This will restore the admin panel to a previous version!${NC}"
echo -e "${YELLOW}Latest backup file: $(basename $LATEST_BACKUP)${NC}"
read -p "Are you sure you want to rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo ""

# Step 4: Perform rollback
echo -e "${YELLOW}Step 3: Performing rollback...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << ROLLBACK_SCRIPT
cd $DEPLOY_PATH
echo "Removing current files..."
rm -rf *

echo "Extracting backup..."
tar xzf $LATEST_BACKUP

echo "✅ Rollback complete!"
echo ""
echo "Admin panel files restored:"
ls -lah | grep -E "(index.html|assets|vite.svg)" || true
ROLLBACK_SCRIPT

echo -e "${GREEN}✅ Rollback complete!${NC}"
echo ""
echo "Admin panel has been restored from: $(basename $LATEST_BACKUP)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open admin panel in browser: https://api-rejuvena.duckdns.org/admin"
echo "2. Hard-refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)"
echo "3. Verify everything is working"
