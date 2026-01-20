# Marathon Frontend Integration & Deployment Guide

## 🎯 Цель
Интегрировать страницы марафонов из `Backend-rejuvena/docs/frontend/` в репозиторий `/web` и задеплоить на GitHub Pages.

---

## 📁 Файлы для копирования

### Исходная директория
```
Backend-rejuvena/docs/frontend/
├── pages/
│   ├── marathons.tsx                    # Список марафонов
│   ├── marathon-detail.tsx              # Детальная страница марафона
│   └── marathon-day.tsx                 # Страница дня марафона
├── components/
│   └── PaymentModalUpdated.tsx          # Обновленная модалка оплаты
└── MARATHON_INTEGRATION_GUIDE.md        # Документация
```

### Целевая директория
```
web/src/
├── pages/
│   ├── marathons/
│   │   ├── index.tsx                    # marathons.tsx → index.tsx
│   │   ├── [id].tsx                     # marathon-detail.tsx → [id].tsx
│   │   └── [id]/
│   │       └── day/
│   │           └── [dayNumber].tsx      # marathon-day.tsx
│   └── ...existing pages
└── components/
    ├── PaymentModal.tsx                 # Replace or merge with PaymentModalUpdated.tsx
    └── ...existing components
```

---

## 🚀 Пошаговая инструкция

### Шаг 1: Перейти в web репозиторий

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
```

### Шаг 2: Создать структуру директорий

```bash
# Создать папки для маршрутов марафонов
mkdir -p src/pages/marathons/[id]/day
```

### Шаг 3: Скопировать файлы страниц

```bash
# Список марафонов
cp ../Backend-rejuvena/docs/frontend/pages/marathons.tsx \
   src/pages/marathons/index.tsx

# Детальная страница марафона
cp ../Backend-rejuvena/docs/frontend/pages/marathon-detail.tsx \
   src/pages/marathons/[id].tsx

# Страница дня
cp ../Backend-rejuvena/docs/frontend/pages/marathon-day.tsx \
   src/pages/marathons/[id]/day/[dayNumber].tsx
```

### Шаг 4: Обновить PaymentModal

**Вариант A: Замена (если старая версия не используется)**
```bash
cp ../Backend-rejuvena/docs/frontend/components/PaymentModalUpdated.tsx \
   src/components/PaymentModal.tsx
```

**Вариант B: Объединение (рекомендуется)**
Открыть оба файла и вручную добавить поддержку `productType='marathon'` в существующую PaymentModal.

### Шаг 5: Проверить импорты

Убедиться, что все импорты корректны:
- `@/components/...` - правильные пути к компонентам
- `@/store/...` - Redux слайсы
- `@/config/api` - API конфигурация

**Пример проверки:**
```typescript
// В marathons/index.tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import PaymentModal from '@/components/PaymentModal';
import api from '@/config/api';
```

### Шаг 6: Добавить типы (если нужно)

Если в `web/src/types/` нет типов для марафонов:

```typescript
// src/types/marathon.ts
export interface Marathon {
  _id: string;
  title: string;
  startDate: string;
  numberOfDays: number;
  tenure: number;
  cost: number;
  isPaid: boolean;
  isPublic: boolean;
  isDisplay: boolean;
  hasContest: boolean;
  language: string;
  welcomeMessage?: string;
  courseDescription?: string;
  rules?: string;
  contestStartDate?: string;
  contestEndDate?: string;
  votingStartDate?: string;
  votingEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarathonDay {
  _id: string;
  marathonId: string;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description?: string;
  exercises: string[]; // Exercise IDs
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarathonEnrollment {
  _id: string;
  userId: string;
  marathonId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  currentDay: number;
  lastAccessedDay: number;
  completedDays: number[];
  paymentId?: string;
  isPaid: boolean;
  expiresAt?: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### Шаг 7: Обновить навигацию (опционально)

Добавить ссылку на марафоны в главное меню:

```typescript
// src/components/Header.tsx или Layout.tsx
<Link href="/marathons">
  <a className="nav-link">Марафоны</a>
</Link>
```

### Шаг 8: Локальное тестирование

```bash
# Запустить dev сервер
npm run dev

# Открыть в браузере
# http://localhost:3000/marathons
# http://localhost:3000/marathons/[test-id]
```

**Проверить:**
- ✅ Список марафонов загружается
- ✅ Детальная страница открывается
- ✅ Кнопка "Записаться" работает
- ✅ PaymentModal открывается для платных марафонов
- ✅ Бесплатные марафоны записываются напрямую
- ✅ Страница дня отображается корректно
- ✅ Чекбоксы упражнений работают
- ✅ Кнопка "Завершить день" активна

### Шаг 9: Исправить базовый путь (если нужно)

Если в `next.config.js` установлен `basePath: '/rejuvena'`:

```typescript
// В файлах страниц, обновить API вызовы
const response = await fetch(`${API_URL}/api/marathons`);

// Убедиться что API_URL не включает basePath:
// ❌ https://seplitza.github.io/rejuvena/api/marathons
// ✅ http://37.252.20.170:9527/api/marathons
```

### Шаг 10: Build и проверка

```bash
# Собрать проект
npm run build

# Проверить ошибки сборки
# Должно быть: "Compiled successfully"
```

**Проверить вывод:**
```
○ /marathons (static)
● /marathons/[id] (SSG: fallback: blocking)
● /marathons/[id]/day/[dayNumber] (SSG: fallback: blocking)
```

### Шаг 11: Коммит изменений

```bash
git add -A
git commit -m "Add marathon pages: list, detail, and day views

- Added marathons listing page with filters
- Added marathon detail page with tabs (info/days/rules)
- Added marathon day page with exercises
- Updated PaymentModal to support marathon payments
- Integrated with backend API at http://37.252.20.170:9527"

git push origin main
```

### Шаг 12: Deploy на GitHub Pages

```bash
# Деплой статического экспорта
npm run build
npx gh-pages -d out -m "Deploy marathon feature to production"
```

**Ожидать:**
- 📤 Публикация занимает 1-3 минуты
- 🌐 Сайт обновится на https://seplitza.github.io/rejuvena/
- ⏱️ CDN кеш может обновляться до 15 минут

### Шаг 13: Проверка на продакшене

Открыть в браузере:
```
https://seplitza.github.io/rejuvena/marathons
```

**Проверить:**
- ✅ Страница загружается без ошибок
- ✅ Данные приходят с API (37.252.20.170:9527)
- ✅ Изображения отображаются
- ✅ Навигация работает
- ✅ Оплата перенаправляет на Alfabank

---

## 🔧 Возможные проблемы и решения

### Проблема 1: 404 на маршрутах

**Причина:** Next.js не видит новые файлы страниц  
**Решение:**
```bash
# Остановить dev сервер (Ctrl+C)
rm -rf .next
npm run dev
```

### Проблема 2: API запросы блокируются CORS

**Причина:** Продакшен домен не в whitelist бэкенда  
**Решение:** Проверить `src/server.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://seplitza.github.io'  // ✅ Должен быть добавлен
  ]
}));
```

### Проблема 3: basePath конфликты

**Причина:** Next.js `basePath: '/rejuvena'` добавляется к API URL  
**Решение:** В `src/config/api.ts`:
```typescript
// ❌ Неправильно
const API_URL = window.location.origin + '/api';

// ✅ Правильно
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://37.252.20.170:9527';
```

### Проблема 4: Изображения не загружаются

**Причина:** Путь к uploads не учитывает API сервер  
**Решение:** В компонентах:
```typescript
// ❌ Неправильно
<img src={`/uploads/${media.filename}`} />

// ✅ Правильно
<img src={`${API_URL}/uploads/${media.filename}`} />
```

### Проблема 5: PaymentModal не открывается

**Причина:** Компонент не импортирован или старая версия  
**Решение:**
```typescript
// Проверить импорт
import PaymentModal from '@/components/PaymentModal';

// Проверить пропсы
<PaymentModal
  isOpen={isPaymentModalOpen}
  onClose={() => setIsPaymentModalOpen(false)}
  productType="marathon"  // ✅ Новый тип
  productId={marathonId}
  amount={marathon.cost}
  productName={marathon.title}
/>
```

---

## 📊 Чеклист перед деплоем

**Код:**
- [ ] Все файлы скопированы в правильные директории
- [ ] Импорты обновлены для структуры проекта
- [ ] Типы TypeScript добавлены (если нужно)
- [ ] PaymentModal поддерживает `productType='marathon'`
- [ ] API URL указывает на продакшн бэкенд

**Тестирование:**
- [ ] `npm run dev` работает без ошибок
- [ ] Все маршруты доступны локально
- [ ] API запросы возвращают данные
- [ ] Запись на бесплатный марафон работает
- [ ] Платёжная модалка открывается для платных
- [ ] Навигация между страницами работает

**Сборка:**
- [ ] `npm run build` завершается успешно
- [ ] Нет TypeScript ошибок
- [ ] Нет warning'ов о missing dependencies
- [ ] Static export генерируется корректно

**Деплой:**
- [ ] Код закоммичен в Git
- [ ] Push в origin/main выполнен
- [ ] `gh-pages` деплой успешен
- [ ] Страница доступна на GitHub Pages
- [ ] API работает на продакшене

---

## 🎨 Опциональные улучшения

### 1. Добавить мета-теги для SEO

```typescript
// src/pages/marathons/index.tsx
import Head from 'next/head';

<Head>
  <title>Марафоны - Rejuvena</title>
  <meta name="description" content="Присоединяйтесь к нашим марафонам омоложения. Синхронный старт, ежедневные упражнения, поддержка команды." />
  <meta property="og:title" content="Марафоны - Rejuvena" />
  <meta property="og:image" content="/images/marathons-preview.jpg" />
</Head>
```

### 2. Добавить loading состояния

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchMarathons()
    .then(data => setMarathons(data))
    .finally(() => setLoading(false));
}, []);

if (loading) return <LoadingSpinner />;
```

### 3. Добавить error boundaries

```typescript
// src/components/ErrorBoundary.tsx
class MarathonErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Marathon page error:', error);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 4. Добавить аналитику

```typescript
// При записи на марафон
gtag('event', 'marathon_enrollment', {
  marathon_id: marathonId,
  marathon_title: title,
  is_paid: isPaid
});
```

---

## 📈 Мониторинг после деплоя

### 1. Проверить логи Backend

```bash
ssh root@37.252.20.170
pm2 logs rejuvena-backend --lines 50 | grep marathon
```

### 2. Проверить GitHub Pages

- Build статус: https://github.com/seplitza/rejuvena/actions
- Pages settings: https://github.com/seplitza/rejuvena/settings/pages

### 3. Проверить пользовательские метрики

```javascript
// MongoDB queries
db.marathonEnrollments.countDocuments({ createdAt: { $gte: new Date('2026-01-20') } })
db.payments.countDocuments({ 'metadata.type': 'marathon', createdAt: { $gte: new Date('2026-01-20') } })
```

---

## ✅ Финальная проверка

После деплоя, открыть в **разных браузерах**:

1. **Desktop:**
   - Chrome: https://seplitza.github.io/rejuvena/marathons
   - Safari: https://seplitza.github.io/rejuvena/marathons
   - Firefox: https://seplitza.github.io/rejuvena/marathons

2. **Mobile (responsive):**
   - iOS Safari
   - Android Chrome

3. **Функционал:**
   - [ ] Список марафонов отображается
   - [ ] Фильтры работают (активные/предстоящие/завершенные)
   - [ ] Клик по марафону открывает детали
   - [ ] Табы переключаются (Инфо/Дни/Правила)
   - [ ] Кнопка записи работает
   - [ ] Прогресс отображается для записанных
   - [ ] Дни разблокируются по расписанию
   - [ ] Упражнения открываются
   - [ ] Завершение дня работает

---

## 🚀 Готово к запуску!

После выполнения всех шагов:
- ✅ Frontend интегрирован в `/web`
- ✅ Локально протестирован
- ✅ Собран без ошибок
- ✅ Задеплоен на GitHub Pages
- ✅ Работает на продакшене

**Марафон система полностью функциональна!** 🎉
