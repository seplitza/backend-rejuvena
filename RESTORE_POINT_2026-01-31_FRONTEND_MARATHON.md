# Точка восстановления: Frontend - Marathon Payment Success
**Дата:** 31 января 2026 г.
**Версия:** 1.2.0

## Описание изменений

### Frontend (web)
Обновлена страница успешной оплаты марафона:

1. **Описание марафона (вместо премиума):**
   - ✓ Полные фото и видео-инструкции
   - ✓ Детальное описание техник
   - ✓ Доступ на {marathonTenure} дней (numberOfDays обучения + 30 практики)
   - ✓ Фотодневник на 90 дней

2. **Telegram уведомление:**
   - Под кнопкой "Перейти в марафон" добавлен текст со ссылкой на бот
   - "Детали оплаты отправлены в https://t.me/Seplitza_info_bot"

### Измененные файлы
- `web/src/pages/payment/success.tsx` - обновлено описание марафона и добавлена ссылка на Telegram

## Откат изменений

### Frontend
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git log --oneline -5
git reset --hard <commit_hash_before_changes>
npm run build
npx gh-pages -d out -m "Rollback: restore previous payment success page"
```

## Проверка работоспособности

1. Оплатить марафон тестовой картой
2. На странице success должны отображаться:
   - Детали марафона (4 пункта)
   - Кнопка "Перейти в марафон"
   - Текст со ссылкой на Telegram бот

## Commit Hash
- Backend: eb73653 (уже задеплоен)
- Frontend: <будет добавлен после коммита>

## Состояние на момент создания бэкапа
- Backend задеплоен на production (GitHub Actions)
- Frontend изменения готовы к коммиту
- Локальный dev server работает на localhost:3000
