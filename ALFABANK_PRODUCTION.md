# Alfabank Production Credentials

## ✅ Боевые данные активированы (28.01.2026)

### Credentials
```
Username: r-seplitza-api
Password: D!ndA6U65Bx*bKq
API URL: https://payment.alfabank.ru/payment/rest
```

### .env Configuration (Production)
```env
# Alfabank Payment Gateway (PRODUCTION)
ALFABANK_USERNAME=r-seplitza-api
ALFABANK_PASSWORD=D!ndA6U65Bx*bKq
ALFABANK_API_URL=https://payment.alfabank.ru/payment/rest
ALFABANK_RETURN_URL=https://seplitza.github.io/rejuvena/payment/success
ALFABANK_FAIL_URL=https://seplitza.github.io/rejuvena/payment/fail
```

### Testing Credentials
```bash
./test-prod-credentials.sh
```

### Deployment Checklist
- [x] Local .env updated with production credentials
- [x] Test script created and validated
- [x] Return URLs configured for GitHub Pages
- [ ] Production server .env updated (pending VPN/IP issue resolution)
- [ ] PM2 restart after .env update

### Production Server Update (When VPN fixed)
```bash
ssh root@37.252.20.170 'cd /var/www/rejuvena-backend && \
  echo "ALFABANK_USERNAME=r-seplitza-api" >> .env && \
  echo "ALFABANK_PASSWORD=D\!ndA6U65Bx*bKq" >> .env && \
  echo "ALFABANK_API_URL=https://payment.alfabank.ru/payment/rest" >> .env && \
  echo "ALFABANK_RETURN_URL=https://seplitza.github.io/rejuvena/payment/success" >> .env && \
  echo "ALFABANK_FAIL_URL=https://seplitza.github.io/rejuvena/payment/fail" >> .env && \
  pm2 restart rejuvena-backend'
```

### Payment Flow (Production)
1. User clicks "Оплатить" → POST `/api/payment/create`
2. Backend registers order with Alfabank production API
3. User redirects to **real** Alfabank payment form
4. After payment → redirect to GitHub Pages
5. Webhook/polling updates user premium status

### Important Notes
- **Боевой режим**: Все платежи теперь реальные
- **Карты**: Только настоящие карты, тестовые карты не работают
- **API**: Production endpoint `payment.alfabank.ru`
- **Return URLs**: GitHub Pages (не localhost)

### Monitoring
```bash
# Check payment logs
ssh root@37.252.20.170 "pm2 logs rejuvena-backend | grep -i alfabank"

# Check recent payments
ssh root@37.252.20.170 "mongosh mongodb://localhost:27017/rejuvena --quiet --eval 'db.payments.find().sort({createdAt: -1}).limit(5).pretty()'"
```
