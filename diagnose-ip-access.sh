#!/bin/bash

# Диагностика IP/VPN ограничений на Timeweb сервере
# Проверяет firewall, fail2ban, nginx конфигурацию

echo "=== IP/VPN Access Diagnostic ==="
echo ""

echo "1. Проверка UFW Firewall:"
ssh root@37.252.20.170 "ufw status verbose" || echo "UFW not active or not installed"
echo ""

echo "2. Проверка iptables правил:"
ssh root@37.252.20.170 "iptables -L -n -v | head -30"
echo ""

echo "3. Проверка fail2ban (блокировка IP):"
ssh root@37.252.20.170 "fail2ban-client status 2>/dev/null || echo 'fail2ban not installed'" 
echo ""

echo "4. Проверка Nginx конфигурации на allow/deny:"
ssh root@37.252.20.170 "grep -r 'allow\|deny' /etc/nginx/ 2>/dev/null | grep -v '#' || echo 'No IP restrictions in nginx'"
echo ""

echo "5. Проверка открытых портов:"
ssh root@37.252.20.170 "ss -tlnp | grep -E ':9527|:80|:443'"
echo ""

echo "6. Проверка GeoIP модулей:"
ssh root@37.252.20.170 "nginx -V 2>&1 | grep -i geoip || echo 'No GeoIP module'"
echo ""

echo "7. Проверка /etc/hosts.allow и /etc/hosts.deny:"
ssh root@37.252.20.170 "cat /etc/hosts.allow /etc/hosts.deny 2>/dev/null || echo 'No hosts access control'"
echo ""

echo "=== Рекомендации ==="
echo "Если найдены ограничения по IP:"
echo "  1. UFW: sudo ufw allow from any to any port 9527"
echo "  2. iptables: sudo iptables -I INPUT -p tcp --dport 9527 -j ACCEPT"
echo "  3. Nginx: удалить 'deny' директивы или добавить 'allow all;'"
echo "  4. fail2ban: sudo fail2ban-client unban --all"
