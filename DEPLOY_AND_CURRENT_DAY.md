# Деплой и логика текущего дня — Справочник для разработчика

## 1. Как работает деплой через GitHub Actions

### Когда запускается
Автоматически при любом `git push` в ветку **`main`** репозитория `https://github.com/seplitza/backend-rejuvena`.

### Что происходит по шагам

```
push → main
  │
  ├─ 1. npm install          (зависимости бэкенда)
  ├─ 2. npm run build         (TypeScript → dist/)
  ├─ 3. cd admin-panel && npm install
  ├─ 4. cd admin-panel && npm run build   (Vite → admin-panel/dist/)
  │      └─ env: VITE_API_URL=/api
  │
  ├─ 5. scp: backend dist/* → /var/www/rejuvena-backend/dist/
  ├─ 6. scp: admin-panel/dist/* → /var/www/rejuvena-backend-temp/admin-panel/
  │
  └─ 7. SSH на сервер:
        ├─ git reset --hard origin/main
        ├─ rsync temp/admin-panel/ → admin-panel/   (атомарно)
        ├─ npm install --production
        └─ pm2 restart rejuvena-backend
```

### Адрес admin-panel в продакшене
```
https://api-rejuvena.duckdns.org/admin/
Файлы на сервере: /var/www/rejuvena-backend/admin-panel/
Nginx config:     /etc/nginx/sites-enabled/rejuvena
```

### Секреты GitHub (Settings → Secrets → Actions)
| Секрет | Значение |
|--------|----------|
| `SERVER_HOST` | IP сервера (37.252.20.170) |
| `SERVER_USER` | root |
| `SERVER_PASSWORD` | пароль SSH (см. DEPLOYMENT.md) |

### Как проверить деплой
1. Открой `https://github.com/seplitza/backend-rejuvena/actions`
2. Найди последний workflow run
3. Зелёная галочка ✅ — деплой прошёл успешно
4. Красный крест ❌ — кликни → смотри шаг с ошибкой → читай логи

### Частые проблемы
- **TypeScript ошибки** — билд падает на шаге `tsc -b`, смотри логи шага «Build Admin Panel»
- **SSH timeout** — сервер временно недоступен, попробуй запустить workflow вручную (кнопка `Re-run jobs`)
- **Старые файлы на сайте** — жёсткое кеширование браузера, Ctrl+Shift+R для сброса кеша

---

## 2. Как правильно определять «текущий день» марафона

### Откуда берётся текущий день
Текущий день считается от `startDate` марафона — дата начала, которая хранится в MongoDB и задаётся на странице «Информация о марафоне» в admin-panel.

> ⚠️ **Важно:** используется `startDate` марафона, а **не** `enrolledAt` пользователя. Все пользователи проходят одни и те же дни одновременно.

### Формула расчёта (TypeScript)
```ts
function getCurrentDayNumber(startDate: string, totalDays: number): number {
  if (!startDate) return 1;

  const now = new Date();
  const start = new Date(startDate);

  // Разница в полных сутках
  const daysPassed = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const currentDay = daysPassed + 1; // день 1 = первый день старта

  if (currentDay < 1) return 1;              // марафон ещё не начался
  if (currentDay > totalDays) return totalDays; // марафон завершён
  return currentDay;
}
```

### Разделение дней на типы
Марафон состоит из двух блоков:
- **Обучение** — дни `1 .. numberOfDays` (задаётся полем `numberOfDays` в модели Marathon)
- **Практика** — дни `numberOfDays + 1 .. totalDays`

```ts
const isLearningDay = (dayNumber: number, numberOfDays: number) =>
  dayNumber <= numberOfDays;

const isPracticeDay = (dayNumber: number, numberOfDays: number) =>
  dayNumber > numberOfDays;
```

### Пример: марафон 44 дня, обучение 14 дней
| Дата | daysPassed | currentDay | Тип |
|------|-----------|------------|-----|
| день старта | 0 | 1 | 📚 Обучение |
| +13 дней | 13 | 14 | 📚 Обучение (последний) |
| +14 дней | 14 | 15 | 🏋️ Практика (1й) |
| +43 дней | 43 | 44 | 🏋️ Практика (последний) |
| после окончания | 44+ | 44 (capped) | 🏋️ Практика |

### Как это используется сейчас (DayNavigation)
Файл: `admin-panel/src/components/DayNavigation.tsx`

Компонент получает `startDate` и `numberOfDays` из MarathonEditor и:
1. Вычисляет `currentDayNumber` через `useMemo`
2. Выделяет текущий день синей рамкой + фоном `#EEF2FF`
3. Дни разделены на две строки: 📚 Обучение / 🏋️ Практика

### Следующий шаг: жёлтые замочки 🔒 на непройденных днях

Для отображения замочков на днях, которые ещё не наступили:

```ts
const isDayLocked = (dayNumber: number, currentDayNumber: number): boolean => {
  return dayNumber > currentDayNumber;
};
```

В кнопке дня добавить:
```tsx
{isDayLocked(day.dayNumber, currentDayNumber) && (
  <span style={{ fontSize: '10px' }}>🔒</span>
)}
```

Стиль для заблокированного дня (приглушённый):
```ts
color: isDayLocked ? '#9CA3AF' : (isActive ? '#4F46E5' : '#374151'),
background: isDayLocked ? '#F9FAFB' : (isActive ? '#EEF2FF' : 'white'),
cursor: isDayLocked ? 'default' : 'pointer',
```

---

## 3. Быстрый старт: внести изменения и задеплоить

```bash
# 1. Перейди в папку admin-panel
cd Backend-rejuvena/admin-panel

# 2. Внеси правки в src/

# 3. Проверь что TypeScript не ругается
npm run build

# 4. Закоммить и запушить (всё вместе — и src, и dist)
cd ..
git add admin-panel/
git commit -m "feat: описание изменения"
git push origin main

# 5. Иди на https://github.com/seplitza/backend-rejuvena/actions и жди ✅
```

> **Почему коммитим dist?** Сервер делает `git reset --hard origin/main` и берёт файлы напрямую. Без dist в репозитории на сервере не будет актуального билда.
