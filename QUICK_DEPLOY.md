# 🚀 Быстрая инструкция по развертыванию

## 1. Подключитесь к серверу
```bash
ssh root@37.252.20.170
```
Пароль: `c+d2Ei@GeWWKq8`

## 2. Запустите установку
```bash
bash /tmp/setup-server.sh
```

## 3. DNS уже настроен
✅ api-rejuvena.duckdns.org → 37.252.20.170

## 4. Установите SSL
```bash
certbot --nginx -d api-rejuvena.duckdns.org --non-interactive --agree-tos -m seplitza@gmail.com
```

## 5. Проверьте
```bash
curl https://api-rejuvena.duckdns.org/health
curl https://api-rejuvena.duckdns.org/api/exercises/public
```

✅ Готово! Бэкенд работает на https://api-rejuvena.duckdns.org
