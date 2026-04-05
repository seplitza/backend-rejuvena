#!/bin/bash

# ================================================================
# Скрипт полного бэкапа проекта Rejuvena
# Создает бэкап БД MongoDB, файлов uploads, конфигураций
# ================================================================

set -e  # Остановка при ошибках

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rejuvena Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Дата для имени бэкапа
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/root/backups/rejuvena_${BACKUP_DATE}"

echo -e "${YELLOW}Создание директории бэкапа...${NC}"
mkdir -p "${BACKUP_DIR}"

# 1. Бэкап MongoDB
echo -e "${YELLOW}[1/6] Бэкап MongoDB базы данных...${NC}"
mongodump --db=rejuvena --out="${BACKUP_DIR}/mongodb" --quiet
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB бэкап создан${NC}"
else
    echo -e "${RED}✗ Ошибка бэкапа MongoDB${NC}"
    exit 1
fi

# 2. Бэкап файлов uploads
echo -e "${YELLOW}[2/6] Бэкап загруженных файлов (uploads)...${NC}"
if [ -d "/var/www/rejuvena-backend/uploads" ]; then
    cp -r /var/www/rejuvena-backend/uploads "${BACKUP_DIR}/uploads"
    echo -e "${GREEN}✓ Файлы uploads скопированы ($(du -sh ${BACKUP_DIR}/uploads | cut -f1))${NC}"
else
    echo -e "${YELLOW}⚠ Директория uploads не найдена${NC}"
fi

# 3. Бэкап .env файлов
echo -e "${YELLOW}[3/6] Бэкап конфигурационных файлов...${NC}"
mkdir -p "${BACKUP_DIR}/config"
cp /var/www/rejuvena-backend/.env "${BACKUP_DIR}/config/.env.backend" 2>/dev/null || echo "No backend .env"
cp /var/www/rejuvena-frontend/.env "${BACKUP_DIR}/config/.env.frontend" 2>/dev/null || echo "No frontend .env"
echo -e "${GREEN}✓ Конфигурации сохранены${NC}"

# 4. Бэкап PM2 конфигурации
echo -e "${YELLOW}[4/6] Бэкап PM2 конфигурации...${NC}"
pm2 save
cp /root/.pm2/dump.pm2 "${BACKUP_DIR}/config/pm2-dump.pm2" 2>/dev/null || true
pm2 describe rejuvena-backend > "${BACKUP_DIR}/config/pm2-rejuvena-backend.txt" 2>/dev/null || true
echo -e "${GREEN}✓ PM2 конфигурация сохранена${NC}"

# 5. Бэкап Nginx конфигураций
echo -e "${YELLOW}[5/6] Бэкап Nginx конфигураций...${NC}"
mkdir -p "${BACKUP_DIR}/nginx"
cp /etc/nginx/sites-enabled/* "${BACKUP_DIR}/nginx/" 2>/dev/null || true
echo -e "${GREEN}✓ Nginx конфигурации сохранены${NC}"

# 6. Создание архива
echo -e "${YELLOW}[6/6] Создание архива...${NC}"
cd /root/backups
tar -czf "rejuvena_${BACKUP_DATE}.tar.gz" "rejuvena_${BACKUP_DATE}"
ARCHIVE_SIZE=$(du -sh "rejuvena_${BACKUP_DATE}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Архив создан: rejuvena_${BACKUP_DATE}.tar.gz (${ARCHIVE_SIZE})${NC}"

# Удаление временной директории
rm -rf "${BACKUP_DIR}"

# Информация о бэкапе
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Бэкап успешно создан!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Файл: ${YELLOW}/root/backups/rejuvena_${BACKUP_DATE}.tar.gz${NC}"
echo -e "Размер: ${YELLOW}${ARCHIVE_SIZE}${NC}"
echo -e ""
echo -e "Для восстановления используйте:"
echo -e "${YELLOW}./restore.sh rejuvena_${BACKUP_DATE}.tar.gz${NC}"
echo -e ""

# Удаление старых бэкапов (старше 30 дней)
echo -e "${YELLOW}Очистка старых бэкапов (>30 дней)...${NC}"
find /root/backups -name "rejuvena_*.tar.gz" -mtime +30 -delete
echo -e "${GREEN}✓ Готово${NC}"

exit 0
