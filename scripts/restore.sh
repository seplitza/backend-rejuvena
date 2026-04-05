#!/bin/bash

# ================================================================
# Скрипт восстановления проекта Rejuvena из бэкапа
# Восстанавливает БД, файлы, конфигурации одной командой
# ================================================================

set -e  # Остановка при ошибках

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rejuvena Restore Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Проверка аргументов
if [ $# -eq 0 ]; then
    echo -e "${RED}Ошибка: Не указан файл бэкапа${NC}"
    echo -e "Использование: $0 <backup_file.tar.gz>"
    echo -e ""
    echo -e "Доступные бэкапы:"
    ls -lh /root/backups/rejuvena_*.tar.gz 2>/dev/null || echo "Нет доступных бэкапов"
    exit 1
fi

BACKUP_FILE="$1"

# Проверка существования файла
if [ ! -f "/root/backups/${BACKUP_FILE}" ] && [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Ошибка: Файл бэкапа не найден${NC}"
    exit 1
fi

# Полный путь к бэкапу
if [ -f "/root/backups/${BACKUP_FILE}" ]; then
    BACKUP_PATH="/root/backups/${BACKUP_FILE}"
else
    BACKUP_PATH="${BACKUP_FILE}"
fi

echo -e "${BLUE}Файл бэкапа: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}Размер: $(du -sh ${BACKUP_PATH} | cut -f1)${NC}"
echo -e ""

# Подтверждение
echo -e "${YELLOW}⚠  ВНИМАНИЕ: Это удалит текущие данные и заменит их бэкапом!${NC}"
read -p "Продолжить? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Отменено${NC}"
    exit 0
fi

# Создание временной директории
RESTORE_DIR="/tmp/rejuvena_restore_$$"
mkdir -p "${RESTORE_DIR}"

# Распаковка архива
echo -e "${YELLOW}[1/6] Распаковка архива...${NC}"
tar -xzf "${BACKUP_PATH}" -C "${RESTORE_DIR}"
BACKUP_NAME=$(basename "${BACKUP_PATH}" .tar.gz)
BACKUP_DATA="${RESTORE_DIR}/${BACKUP_NAME}"
echo -e "${GREEN}✓ Архив распакован${NC}"

# Остановка PM2
echo -e "${YELLOW}[2/6] Остановка сервисов...${NC}"
pm2 stop all
echo -e "${GREEN}✓ Сервисы остановлены${NC}"

# Восстановление MongoDB
echo -e "${YELLOW}[3/6] Восстановление MongoDB...${NC}"
if [ -d "${BACKUP_DATA}/mongodb" ]; then
    mongorestore --db=rejuvena --drop "${BACKUP_DATA}/mongodb/rejuvena" --quiet
    echo -e "${GREEN}✓ База данных восстановлена${NC}"
else
    echo -e "${RED}✗ MongoDB бэкап не найден${NC}"
fi

# Восстановление файлов uploads
echo -e "${YELLOW}[4/6] Восстановление файлов uploads...${NC}"
if [ -d "${BACKUP_DATA}/uploads" ]; then
    rm -rf /var/www/rejuvena-backend/uploads
    cp -r "${BACKUP_DATA}/uploads" /var/www/rejuvena-backend/
    chown -R root:root /var/www/rejuvena-backend/uploads
    echo -e "${GREEN}✓ Файлы восстановлены${NC}"
else
    echo -e "${YELLOW}⚠ Uploads не найдены в бэкапе${NC}"
fi

# Восстановление конфигураций
echo -e "${YELLOW}[5/6] Восстановление конфигураций...${NC}"
if [ -f "${BACKUP_DATA}/config/.env.backend" ]; then
    cp "${BACKUP_DATA}/config/.env.backend" /var/www/rejuvena-backend/.env
    echo -e "${GREEN}✓ Backend .env восстановлен${NC}"
fi

# Перезапуск PM2
echo -e "${YELLOW}[6/6] Запуск сервисов...${NC}"
cd /var/www/rejuvena-backend
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✓ Сервисы запущены${NC}"

# Очистка
rm -rf "${RESTORE_DIR}"

# Итоги
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Восстановление завершено!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "Статус сервисов:"
pm2 list
echo -e ""
echo -e "${GREEN}✓ Все готово!${NC}"

exit 0
