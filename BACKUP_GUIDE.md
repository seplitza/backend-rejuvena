# 📦 Руководство по бэкапу и восстановлению Rejuvena

## 🎯 Быстрый старт - Одна кнопка

### Создать бэкап прямо сейчас
```bash
ssh root@37.252.20.170 'cd /var/www/rejuvena-backend/scripts && ./backup.sh'
```

### Восстановить последний бэкап (одна команда!)
```bash
ssh root@37.252.20.170 'cd /var/www/rejuvena-backend/scripts && ./quick-restore.sh'
```

**Вот и всё!** Система полностью восстановлена.

---

## 📋 Что включает бэкап

1. **База данных MongoDB** - вся БД `rejuvena`
2. **Файлы uploads** - все загруженные изображения и документы
3. **Конфигурации .env** - все переменные окружения
4. **PM2 конфигурация** - настройки процессов
5. **Nginx конфигурации** - настройки веб-сервера

---

## 🔧 Детальные инструкции

### 1. Создание бэкапа

```bash
# На сервере
cd /var/www/rejuvena-backend/scripts
./backup.sh
```

**Результат:** Файл `/root/backups/rejuvena_YYYYMMDD_HHMMSS.tar.gz`

**Что происходит:**
- ✅ Создается дамп MongoDB
- ✅ Копируются все файлы uploads/
- ✅ Сохраняются .env файлы
- ✅ Экспортируется конфигурация PM2
- ✅ Копируются настройки Nginx
- ✅ Всё упаковывается в архив .tar.gz
- ✅ Старые бэкапы (>30 дней) удаляются

**Время выполнения:** 30-60 секунд  
**Размер бэкапа:** ~50-200 MB (зависит от uploads)

---

### 2. Восстановление из конкретного бэкапа

```bash
# Посмотреть все доступные бэка пы
ls -lh /root/backups/

# Восстановить конкретный бэкап
cd /var/www/rejuvena-backend/scripts
./restore.sh rejuvena_20260405_153000.tar.gz
```

**Что происходит:**
1. Останавливаются все PM2 процессы
2. Восстанавливается MongoDB (с --drop, заменяет текущую БД!)
3. Восстанавливаются файлы uploads/
4. Восстанавливаются .env файлы
5. Перезапускаются PM2 процессы

⚠️ **ВНИМАНИЕ:** Текущие данные будут заменены данными из бэкапа!

---

### 3. Быстрое восстановление (последний бэкап)

```bash
cd /var/www/rejuvena-backend/scripts
./quick-restore.sh
```

Автоматически находит и восстанавливает самый свежий бэкап.

---

## 🤖 Автоматический бэкап (Cron)

Настроить ежедневный бэкап в 3:00 ночи:

```bash
# Открыть crontab
crontab -e

# Добавить строку:
0 3 * * * /var/www/rejuvena-backend/scripts/backup.sh >> /var/log/rejuvena-backup.log 2>&1
```

---

## 📁 Структура бэкапа

```
rejuvena_20260405_153000.tar.gz
└── rejuvena_20260405_153000/
    ├── mongodb/              # Дамп MongoDB
    │   └── rejuvena/
    ├── uploads/              # Загруженные файлы
    │   ├── photos/
    │   ├── products/
    │   └── temp/
    ├── config/               # Конфигурации
    │   ├── .env.backend
    │   ├── .env.frontend
    │   ├── pm2-dump.pm2
    │   └── pm2-rejuvena-backend.txt
    └── nginx/                # Nginx конфиги
        ├── default
        ├── api-rejuvena
        └── shop.seplitza.ru
```

---

## 🚨 Типичные сценарии

### Сценарий 1: "Что-то сломал, нужно быстро откатиться"
```bash
ssh root@37.252.20.170
cd /var/www/rejuvena-backend/scripts
./quick-restore.sh
# Подтвердить: yes
```
**Время:** 2-3 минуты

---

### Сценарий 2: "Нужно проверить бэкап который создан вчера"
```bash
ssh root@37.252.20.170
ls -lh /root/backups/  # Посмотреть список
cd /var/www/rejuvena-backend/scripts
./restore.sh rejuvena_20260404_030000.tar.gz
```

---

### Сценарий 3: "Перенос на новый сервер"

**На старом сервере:**
```bash
./backup.sh
scp /root/backups/rejuvena_*.tar.gz user@new-server:/root/backups/
```

**На новом сервере:**
```bash
# 1. Установить зависимости
apt update && apt install -y mongodb nodejs npm nginx

# 2. Склонировать репозиторий
git clone https://github.com/seplitza/backend-rejuvena.git /var/www/rejuvena-backend

# 3. Восстановить бэкап
cd /var/www/rejuvena-backend/scripts
chmod +x *.sh
./restore.sh rejuvena_20260405_153000.tar.gz
```

---

## 🔍 Проверка бэкапа

Убедиться что бэкап создан корректно:

```bash
# Посмотреть содержимое без распаковки
tar -tzf /root/backups/rejuvena_20260405_153000.tar.gz | head -20

# Проверить размер
du -sh /root/backups/rejuvena_20260405_153000.tar.gz

# Тестовая распаковка
mkdir -p /tmp/backup-test
tar -xzf /root/backups/rejuvena_20260405_153000.tar.gz -C /tmp/backup-test
ls -lah /tmp/backup-test/
rm -rf /tmp/backup-test
```

---

## 📝 Логи

### Логи бэкапа
```bash
# Если настроен cron
tail -f /var/log/rejuvena-backup.log
```

### Логи PM2 после восстановления
```bash
pm2 logs rejuvena-backend
```

---

## ⚙️ Настройка скриптов

### Изменить срок хранения бэкапов

В файле `backup.sh` найти и изменить:
```bash
# Удаление старых бэкапов (старше 30 дней)
find /root/backups -name "rejuvena_*.tar.gz" -mtime +30 -delete
```

Изменить `+30` на нужное количество дней.

### Изменить директорию бэкапов

Заменить `/root/backups` на свою директорию во всех скриптах:
- backup.sh
- restore.sh
- quick-restore.sh

---

## 🆘 Troubleshooting

### "mongodump: command not found"
```bash
apt install -y mongodb-database-tools
```

### "Permission denied"
```bash
chmod +x /var/www/rejuvena-backend/scripts/*.sh
```

### "PM2 процесс не запускается после восстановления"
```bash
pm2 delete all
pm2 start /var/www/rejuvena-backend/ecosystem.config.js
pm2 save
```

### "База данных не восстанавливается"
```bash
# Проверить работу MongoDB
systemctl status mongodb

# Вручную восстановить
mongorestore --db=rejuvena --drop /path/to/backup/mongodb/rejuvena
```

---

## 📊 Мониторинг дискового пространства

```bash
# Проверить место на диске
df -h

# Размер всех бэкапов
du -sh /root/backups/

# Количество бэкапов
ls /root/backups/rejuvena_*.tar.gz | wc -l
```

---

## 🔐 Безопасность

⚠️ **Бэкапы содержат:**
- Пароли к БД
- API ключи
- Токены доступа
- Данные пользователей

**Рекомендации:**
1. Хранить бэкапы на защищенном сервере
2. Использовать шифрование для передачи бэкапов
3. Ограничить доступ к директории /root/backups/
4. Периодически копировать бэкапы на удаленное хранилище

### Шифрование бэкапа (опционально)
```bash
# Зашифровать
gpg -c /root/backups/rejuvena_20260405_153000.tar.gz

# Расшифровать
gpg /root/backups/rejuvena_20260405_153000.tar.gz.gpg
```

---

## 📞 Поддержка

При проблемах с бэкапом/восстановлением:
1. Проверить логи: `tail -100 /var/log/rejuvena-backup.log`
2. Проверить PM2: `pm2 list`
3. Проверить MongoDB: `systemctl status mongodb`
4. Связаться с разработчиком

---

**Последнее обновление:** 5 апреля 2026  
**Версия:** 1.0.0
