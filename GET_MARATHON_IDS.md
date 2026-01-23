# Как получить ID всех 10 марафонов из Azure

## Проблема
API `/api/usermarathon/getmarathons` возвращает только кастомные марафоны, но не основные продакшн марафоны.

## Решение: Browser Network Inspection

### Шаг 1: Откройте старое приложение
```
https://seplitza.github.io/Rejuvena_old_app/
```

### Шаг 2: Войдите в аккаунт
- Email: `seplitza@gmail.com`
- Password: `1234`

### Шаг 3: Откройте DevTools
- Нажмите `F12` или `Cmd+Option+I` (Mac)
- Перейдите на вкладку **Network**
- Включите фильтр: **Fetch/XHR**

### Шаг 4: Соберите ID марафонов
Для каждого марафона в списке:
1. Кликните на карточку марафона
2. В Network tab найдите запрос: `startmarathon?marathonId=XXX`
3. Скопируйте:
   - **Marathon ID** (из URL параметра)
   - **Title** (название марафона на русском)
   - **Number of Days** (кол-во дней - обычно 14)

### Шаг 5: Заполните таблицу

| # | Название | Marathon ID | Дней |
|---|----------|-------------|------|
| 1 | Омолодись | `3842e63f-b125-447d-94a1-b1c93be38b4e` | 14 |
| 2 | ??? | ??? | ??? |
| 3 | ??? | ??? | ??? |
| 4 | ??? | ??? | ??? |
| 5 | ??? | ??? | ??? |
| 6 | ??? | ??? | ??? |
| 7 | ??? | ??? | ??? |
| 8 | ??? | ??? | ??? |
| 9 | ??? | ??? | ??? |
| 10 | ??? | ??? | ??? |

## Формат для скрипта
После сбора всех ID, добавьте их в `migrate-marathons.ts`:

```typescript
const AZURE_MARATHONS = [
  ['3842e63f-b125-447d-94a1-b1c93be38b4e', 'Омолодись', 14],
  ['YOUR_ID_HERE', 'Название марафона', 14],
  // ... остальные 8 марафонов
] as const;
```

## Альтернативный способ (если Network tab не работает)

### Через консоль браузера:
1. Откройте старое приложение
2. Войдите в аккаунт
3. Откройте Console в DevTools
4. Выполните команду:
```javascript
// Получить токен
const token = localStorage.getItem('auth_token');

// Запросить список марафонов
fetch('https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api/usermarathon/getmarathons', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(marathons => {
    console.table(marathons.map(m => ({
      id: m.id,
      title: m.title,
      days: m.days,
      isPublic: m.isPublic,
      isDisplay: m.isDisplay
    })));
  });
```

5. Скопируйте результат из консоли

## После сбора всех ID

Запустите команду для проверки:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
npx ts-node src/scripts/migrate-marathons.ts list-marathons
```

Должен показать все 10 марафонов.
