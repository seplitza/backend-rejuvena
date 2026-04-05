#!/bin/bash

# ================================================================
# БЫСТРОЕ ВОССТАНОВЛЕНИЕ - ОДНА КОМАНДА
# Восстанавливает самый последний бэкап автоматически
# ================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Quick Restore - Последний бэкап${NC}"
echo -e "${GREEN}========================================${NC}"

# Найти последний бэкап
LATEST_BACKUP=$(ls -t /root/backups/rejuvena_*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${YELLOW}Бэкапов не найдено. Создайте бэкап командой:${NC}"
    echo -e "  ./backup.sh"
    exit 1
fi

echo -e "${YELLOW}Последний бэкап:${NC} $(basename ${LATEST_BACKUP})"
echo -e "${YELLOW}Дата:${NC} $(date -r ${LATEST_BACKUP} '+%Y-%m-%d %H:%M:%S')"
echo -e "${YELLOW}Размер:${NC} $(du -sh ${LATEST_BACKUP} | cut -f1)"
echo -e ""

# Запуск скрипта восстановления
./restore.sh "$(basename ${LATEST_BACKUP})"
