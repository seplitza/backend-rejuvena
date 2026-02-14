# Marathon Exercise Tracking - TODO List

Дата: 14 февраля 2026 г.

## Контекст

Реализована система отслеживания прогресса упражнений в марафонах:
- ✅ Создана модель MarathonExerciseProgress
- ✅ Добавлены API endpoints для сохранения статуса упражнений
- ✅ Фронтенд Redux saga с обновлением звезд
- ✅ Изменен .env.local на localhost:9527 для тестирования
- ✅ Создан enrollment для пользователя seplitza@gmail.com в тестовом марафоне

## Задачи

### В процессе тестирования
- [ ] **Протестировать клик по чекбоксам упражнений**
  - Открыть: http://localhost:3000/marathons/698ed3f3a6ef329baa134976/day/1
  - Кликнуть чекбокс любого упражнения
  - Проверить что POST запрос успешен (200 OK)

- [ ] **Проверить MarathonExerciseProgress в MongoDB**
  - После клика проверить: `db.marathonexerciseprogresses.find().pretty()`
  - Должна появиться запись с userId, marathonId, dayNumber, exerciseId, isCompleted: true

- [ ] **Проверить обновление звезд в DaysList**
  - Вернуться на страницу марафона
  - Блок "Обучение" - день 1 должен показать звезды в зависимости от % выполненных упражнений:
    - 1★ — ≥1% упражнений
    - 2★ — ≥50% упражнений  
    - 3★ — 100% упражнений

### Деплой на продакшн
- [ ] **Закоммитить изменения в Git**
  ```bash
  cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
  git add -A
  git commit -m "feat: exercise progress tracking with star ratings"
  git push
  ```

- [ ] **Задеплоить бэкенд на продакшн**
  - Вариант A: Автоматический деплой через GitHub Actions (если настроен)
  - Вариант B: Ручной деплой:
    ```bash
    ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && git pull && npm install && npm run build && pm2 restart rejuvena-backend"
    ```

- [ ] **Вернуть .env.local на продакшн API**
  - После успешного деплоя бэкенда изменить web/.env.local:
    ```
    NEXT_PUBLIC_API_URL=https://api-rejuvena.duckdns.org
    ```
  - Закоммитить изменение
  - Задеплоить фронтенд через GitHub Actions или `npm run build && npx gh-pages`

## Технические детали

### Тестовый марафон
- ID: 698ed3f3a6ef329baa134976
- Название: ТЕСТ 4 (копия СТАРТ 13 фев)
- User ID: 695909bfc597ef2f3daaf5db (seplitza@gmail.com)
- Enrollment ID: 698f54396a0bb856e93ffc51

### API Endpoints (новые)
- POST `/api/marathons/:id/day/:dayNumber/exercise/:exerciseId/status` - установить статус упражнения
- GET `/api/marathons/:id/progress` - получить прогресс с dayProgress картой
- GET `/api/marathons/:id/day/:dayNumber` - получить день с completedExerciseIds

### Локальная разработка
- Backend: npm run dev → http://localhost:9527
- Frontend: npm run dev → http://localhost:3000
- MongoDB: mongodb://localhost:27017/rejuvena

### Credentials для входа
- Email: seplitza@gmail.com
- Password: 1234back

## Коммиты
- 8a66c8d: Backend exercise progress tracking
- 34e6a01: Frontend exercise progress tracking with star updates
- 1c164e5: Fixed saga parallel calls

## Следующие шаги после тестирования
1. Протестировать локально что всё работает
2. Закоммитить в Git
3. Задеплоить бэкенд на продакшн
4. Вернуть .env.local на продакшн URL
5. Протестировать на продакшн (api-rejuvena.duckdns.org)
