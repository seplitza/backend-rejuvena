# Admin Panel Deployment & Rollback Guide

## Overview

The admin panel is a React + TypeScript + Vite application built separately from the main backend. It's deployed manually to the production server using SSH/SCP.

## Deployment Architecture

```
Local Development
  ↓
npm run build → dist/ folder (499KB)
  ↓
Archive → /tmp/admin-panel-YYYYMMDD.tar.gz
  ↓
SCP to Server → /tmp/
  ↓
SSH Extract → /var/www/rejuvena-admin/
  ↓
Browser Clear Cache → Hard Refresh
```

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel
bash deploy-admin.sh
```

This script will:
1. ✅ Build the admin panel
2. ✅ Create deployment archive
3. ✅ Create backup on server
4. ✅ Upload archive to server
5. ✅ Deploy on server
6. ✅ Cleanup temporary files

### Option 2: Manual Deployment

#### Step 1: Build locally
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel
npm run build
```

#### Step 2: Create archive
```bash
cd dist
tar czf /tmp/admin-panel.tar.gz *
```

#### Step 3: Create backup on server
```bash
ssh root@37.252.20.170 << 'EOF'
mkdir -p /var/backups/admin-panel
cd /var/www/rejuvena-admin
tar czf /var/backups/admin-panel/admin-panel-$(date +%Y%m%d_%H%M%S).tar.gz * .* 2>/dev/null || true
EOF
```

#### Step 4: Upload archive
```bash
scp /tmp/admin-panel.tar.gz root@37.252.20.170:/tmp/
```

#### Step 5: Deploy on server
```bash
ssh root@37.252.20.170 "cd /var/www/rejuvena-admin && rm -rf * && tar xzf /tmp/admin-panel.tar.gz && rm /tmp/admin-panel.tar.gz && ls -la"
```

#### Step 6: Cleanup
```bash
rm /tmp/admin-panel.tar.gz
```

### Option 3: Manual via Timeweb Console

1. Login to Timeweb: https://timeweb.cloud/my/servers
2. Click **Облачные серверы** → **Выделенные серверы** → **Консоль**
3. Execute commands:

```bash
# Create backup before deploying
mkdir -p /var/backups/admin-panel
cd /var/www/rejuvena-admin
tar czf /var/backups/admin-panel/admin-panel-$(date +%Y%m%d_%H%M%S).tar.gz * .* 2>/dev/null || true

# If archive is in /tmp/, extract it
cd /var/www/rejuvena-admin
rm -rf *
tar xzf /tmp/admin-panel.tar.gz
ls -la
```

## Rollback Procedure

### Option 1: Automated Rollback (Recommended)

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel
bash rollback-admin.sh
```

This will:
1. ✅ List all available backups
2. ✅ Ask for confirmation
3. ✅ Restore from the latest backup
4. ✅ Verify restoration

### Option 2: Manual Rollback

```bash
# List available backups
ssh root@37.252.20.170 "ls -lh /var/backups/admin-panel/"

# Choose a backup and restore it
ssh root@37.252.20.170 << 'EOF'
BACKUP_FILE="/var/backups/admin-panel/admin-panel-20260329_120213.tar.gz" # Choose the one you want
cd /var/www/rejuvena-admin
rm -rf *
tar xzf $BACKUP_FILE
ls -la
EOF
```

### Option 3: Manual via Timeweb Console

```bash
# List backups
ls -lh /var/backups/admin-panel/

# Choose backup and restore
cd /var/www/rejuvena-admin
rm -rf *
tar xzf /var/backups/admin-panel/admin-panel-20260329_120213.tar.gz # Use your backup date
ls -la
```

## After Deployment

1. **Clear Browser Cache**
   - Mac: **Cmd + Shift + R**
   - Windows/Linux: **Ctrl + Shift + R**
   - Or: Open DevTools (F12) → Settings → Network → "Disable cache"

2. **Test Admin Panel**
   - Open: https://api-rejuvena.duckdns.org/admin
   - Login with your admin credentials
   - Navigate to: **Марафоны → Edit Marathon → Упражнения (Tab 4)**
   - Should see: 📚 🏋️ sticky day navigation at the top

3. **Verify Features**
   - Click on day numbers → page should scroll smoothly
   - Current day should be highlighted with color & border
   - Emojis should show: 📚 for training days, 🏋️ for practice days

## Backup Management

Backups are automatically stored in `/var/backups/admin-panel/` on the server.

- **Location**: `/var/backups/admin-panel/admin-panel-YYYYMMDD_HHMMSS.tar.gz`
- **Retention**: Last 5 backups are kept automatically
- **Size**: ~500KB per backup

To list backups manually:
```bash
ssh root@37.252.20.170 "ls -lh /var/backups/admin-panel/"
```

## Troubleshooting

### Issue: "File not found" during deployment

**Solution:** Check that archive was created and uploaded to /tmp/:
```bash
ssh root@37.252.20.170 "ls -lh /tmp/admin-panel*.tar.gz"
```

### Issue: Admin panel shows old content after deployment

**Solution:** Clear browser cache completely:
1. Open DevTools (F12)
2. Right-click refresh button
3. Choose "Empty Cache and Hard Refresh"
4. Or: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)

### Issue: Only some files deployed

**Solution:** Check that all files were extracted:
```bash
ssh root@37.252.20.170 "ls -la /var/www/rejuvena-admin/"
```

Should show: `index.html`, `assets/`, `vite.svg`

### Issue: Need to emergency rollback

**Solution:** Use automated rollback script:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel
bash rollback-admin.sh
```

## File Structure

```
/var/www/rejuvena-admin/
├── index.html              # Main HTML file
├── assets/
│   ├── index-B6JUJVKp.css # Compiled styles
│   └── index-KlejS8S_.js   # Compiled JavaScript
└── vite.svg               # Vite logo

/var/backups/admin-panel/
├── admin-panel-20260329_120000.tar.gz
├── admin-panel-20260328_150000.tar.gz
└── ...
```

## Server Access

- **IP**: 37.252.20.170
- **User**: root
- **Auth**: SSH key at ~/.ssh/id_ed25519
- **SSH Config**: ~/.ssh/config

## GitHub Actions

**Note:** GitHub Actions currently deploys only the web app (rejuvena + shop) to GitHub Pages at `/rejuvena` path.

**Admin panel is NOT included in GitHub Actions** and must be deployed manually using either:
- `deploy-admin.sh` script (automated)
- Manual SSH commands (manual)
- Timeweb console (web UI)

## Questions?

If you encounter issues, check:
1. Server connectivity: `ssh root@37.252.20.170 "echo OK"`
2. Deployed files: `ssh root@37.252.20.170 "ls -la /var/www/rejuvena-admin/"`
3. Backups available: `ssh root@37.252.20.170 "ls -lh /var/backups/admin-panel/"`
4. Browser cache cleared (hard refresh)
