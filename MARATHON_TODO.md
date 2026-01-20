# 🏃‍♀️ TODO: Система Марафонов Rejuvena

## 📋 Общий план реализации

### Фаза 1: Backend API (Модели + Endpoints)
### Фаза 2: Admin Panel (UI для управления)
### Фаза 3: Frontend (Отображение для пользователей)

---

## 🔧 ФАЗА 1: BACKEND API

### 1.1 Модели данных
- [ ] **Marathon Model** (`src/models/Marathon.model.ts`)
  ```typescript
  - title: string
  - subTitle?: string
  - description: string
  - image?: string
  - numberOfDays: number (14 для "Омолодись")
  - cost: number
  - materialAvailabilityDays: number
  - isPublic: boolean
  - isDisplay: boolean
  - isPaid: boolean
  - hasContest: boolean
  - hasComment: boolean
  - autoCrop: boolean
  - language: 'ru' | 'en'
  - startDate: Date (фиксированная дата старта для всех!)
  - contestUploadLastDate?: Date
  - finalistAnnouncementDate?: Date
  - votingLastDate?: Date
  - winnerAnnouncementDate?: Date
  - welcomeMessage: string (rich text)
  - courseDescription: string (rich text)
  - rules: string (rich text)
  - tenure: number (общая длительность: обучение + практика)
  - createdAt: Date
  - updatedAt: Date
  ```

- [ ] **MarathonDay Model** (`src/models/MarathonDay.model.ts`)
  ```typescript
  - marathonId: ObjectId (ref Marathon)
  - dayNumber: number (1-14 для обучения, 15-44 для практики)
  - dayType: 'learning' | 'practice'
  - description: string (rich text)
  - exercises: ObjectId[] (ref Exercise)
  - order: number
  - createdAt: Date
  ```

- [ ] **MarathonEnrollment Model** (`src/models/MarathonEnrollment.model.ts`)
  ```typescript
  - userId: ObjectId (ref User)
  - marathonId: ObjectId (ref Marathon)
  - enrolledAt: Date
  - status: 'pending' | 'active' | 'completed' | 'cancelled'
  - currentDay: number
  - lastAccessedDay: number
  - completedDays: number[]
  - paymentId?: ObjectId (ref Payment)
  - isPaid: boolean
  - expiresAt: Date (startDate + tenure дней)
  - createdAt: Date
  ```

### 1.2 API Routes (`src/routes/marathon.routes.ts`)

#### Public Endpoints
- [ ] `GET /api/marathons` - Список всех публичных марафонов
- [ ] `GET /api/marathons/:id` - Детали марафона
- [ ] `GET /api/marathons/:id/days` - Список дней марафона
- [ ] `GET /api/marathons/:id/day/:dayNumber` - Контент конкретного дня

#### Protected Endpoints (требуют авторизации)
- [ ] `POST /api/marathons/:id/enroll` - Записаться на марафон
- [ ] `GET /api/marathons/my-enrollments` - Мои марафоны
- [ ] `GET /api/marathons/:id/progress` - Прогресс пользователя
- [ ] `POST /api/marathons/:id/complete-day` - Отметить день завершенным

#### Admin Endpoints (admin/superadmin only)
- [ ] `GET /api/marathons/admin/all` - Все марафоны (включая неопубликованные)
- [ ] `POST /api/marathons/admin/create` - Создать марафон
- [ ] `PUT /api/marathons/admin/:id` - Обновить марафон
- [ ] `DELETE /api/marathons/admin/:id` - Удалить марафон
- [ ] `POST /api/marathons/admin/:id/days` - Добавить день
- [ ] `PUT /api/marathons/admin/:id/days/:dayId` - Обновить день
- [ ] `DELETE /api/marathons/admin/:id/days/:dayId` - Удалить день
- [ ] `GET /api/marathons/admin/:id/enrollments` - Участники марафона
- [ ] `POST /api/marathons/admin/:id/duplicate` - Дублировать марафон

### 1.3 Бизнес-логика
- [ ] **Проверка доступа к дню**
  - Рассчитать текущий доступный день от startDate
  - Блокировать будущие дни до их даты
  - Разрешать доступ к прошлым дням

- [ ] **Автоматическая активация**
  - Webhook/cron для активации марафона в startDate
  - Отправка уведомлений участникам в день старта

- [ ] **Интеграция с платежами**
  - Создание MarathonEnrollment при успешной оплате
  - Обновление metadata в Payment с marathonId

---

## 🎨 ФАЗА 2: ADMIN PANEL

### 2.1 Страница списка марафонов (`admin-panel/src/pages/MarathonList.tsx`)
- [ ] Таблица с колонками:
  - S.No
  - Marathon Name
  - Image (превью)
  - Start Date
  - Tenure (дней)
  - Status (опубликован/черновик)
  - Participants (количество)
  - Actions (Edit, Delete, Duplicate, View)

- [ ] Функции:
  - Фильтр по статусу
  - Поиск по названию
  - Сортировка по дате
  - Кнопка "CREATE MARATHON"

### 2.2 Страница создания/редактирования (`admin-panel/src/pages/MarathonEditor.tsx`)

**Табы (как на скриншоте):**

#### Tab 1: INFORMATION
- [ ] Поля:
  - Is Paid (checkbox)
  - Title (input)
  - Sub Title (input)
  - Description (textarea)
  - Image (file upload)
  - Number Of Days (number)
  - Cost (number)
  - Material Availability Days (number)
  - Is Public (checkbox)
  - Is Display (checkbox)
  - Contest (checkbox)
  - Comment (checkbox)
  - Auto Crop (checkbox)
  - Language (select: Russian/English)
  - Start Date (datepicker) **КРИТИЧНО!**
  - Contest Upload Last Date (datepicker)
  - Finalist Announcement Date (datepicker)
  - Voting Last Date (datepicker)
  - Winner Announcement Date (datepicker)

#### Tab 2: MESSAGE
- [ ] Welcome Message (rich text editor - TipTap)
- [ ] Course Description (rich text editor - TipTap)

#### Tab 3: RULES
- [ ] Rules (rich text editor - TipTap)

#### Tab 4: EXERCISES
- [ ] Таблица дней:
  - S.No
  - Day (Day 01, Day 02...)
  - Description
  - Category & Exercise (выбор упражнений)
  - Copy Exercise Content (кнопка)
  - Remove content (кнопка)

- [ ] Функции:
  - Добавить день
  - Выбрать упражнения из существующих
  - Drag & drop сортировка
  - PASTE TO ALL (скопировать упражнения на все дни)
  - REMOVE ALL CONTENT (очистить все)

#### Tab 5: PRACTICE EXERCISE
- [ ] Аналогично Tab 4, но для дней практики (15-44)

#### Tab 6: PLANS
- [ ] Список планов на каждый день (текстовое описание)
- [ ] Отображение как на скриншоте с Day 01, Day 02...

- [ ] Кнопки:
  - BACK (назад на предыдущий таб)
  - NEXT (следующий таб)
  - UPDATE/SAVE (сохранить марафон)

### 2.3 Компоненты
- [ ] `MarathonCard.tsx` - Карточка марафона
- [ ] `MarathonDayEditor.tsx` - Редактор дня
- [ ] `ExercisePicker.tsx` - Выбор упражнений
- [ ] `RichTextEditor.tsx` - Rich text редактор (TipTap)

---

## 🌐 ФАЗА 3: FRONTEND (User-facing)

### 3.1 Страница списка марафонов (`web/src/pages/marathons/index.tsx`)
- [ ] Сетка карточек марафонов
- [ ] Фильтры (предстоящие/активные/завершенные)
- [ ] Карточка показывает:
  - Изображение
  - Название
  - Дата старта
  - Количество дней
  - Цена
  - Кнопка "Записаться" / "Начать"

### 3.2 Страница марафона (`web/src/pages/marathons/[marathonId].tsx`)
- [ ] Hero секция с изображением
- [ ] Информация о марафоне
- [ ] Welcome Message
- [ ] Course Description
- [ ] Rules
- [ ] Программа (список дней)
- [ ] Кнопка записи/оплаты
- [ ] Таймер до старта (если еще не начался)

### 3.3 Страница дня марафона (`web/src/pages/marathons/[marathonId]/day/[dayNumber].tsx`)
- [ ] Хлебные крошки навигации
- [ ] Описание дня
- [ ] Список упражнений
- [ ] Видео/изображения
- [ ] Прогресс бар (какой день из общего количества)
- [ ] Кнопка "Завершить день"
- [ ] Навигация между днями

### 3.4 Redux State
- [ ] `marathonSlice.ts`:
  ```typescript
  - marathons: Marathon[]
  - currentMarathon: Marathon | null
  - myEnrollments: MarathonEnrollment[]
  - currentDay: MarathonDay | null
  - loading: boolean
  - error: string | null
  ```

---

## 💳 ФАЗА 4: ИНТЕГРАЦИЯ С ПЛАТЕЖАМИ

### 4.1 Backend
- [ ] Обновить `payment.routes.ts`:
  - Новый endpoint `/api/payment/create-marathon`
  - Добавить `marathonId` и `marathonName` в metadata
  - Создавать MarathonEnrollment при успешной оплате

### 4.2 Frontend
- [ ] `MarathonPaymentModal.tsx` - модалка оплаты марафона
- [ ] Обновить `paymentSlice.ts` для поддержки марафонов

---

## 🔔 ФАЗА 5: УВЕДОМЛЕНИЯ

- [ ] Email уведомление при записи на марафон
- [ ] Email за день до старта
- [ ] Email в день старта
- [ ] Push уведомления (опционально)

---

## 📝 ДЕПЛОЙ И КОММИТ

### Путь деплоя Backend:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git add -A
git commit -m "Marathon feature: [описание]"
git push
# GitHub Actions автоматически задеплоит на production
```

### Путь деплоя Admin Panel:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/admin-panel
npm run build
cd ..
git add admin-panel/dist
git commit -m "Admin: Marathon management UI"
git push
# GitHub Actions соберет и задеплоит
```

### Путь деплоя Frontend:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run build
npx gh-pages -d out -m "Marathon feature for users"
git add -A
git commit -m "Frontend: Marathon pages"
git push
```

---

## 🎯 ПРИОРИТЕТЫ

### Высокий приоритет (MVP)
1. ✅ Backend модели (Marathon, MarathonDay, MarathonEnrollment)
2. ✅ Admin CRUD API endpoints
3. ✅ Admin Panel - создание марафона (Tab 1: INFORMATION)
4. ✅ Admin Panel - добавление дней и упражнений (Tab 4: EXERCISES)
5. ✅ Frontend - страница марафона
6. ✅ Интеграция с платежами
7. ✅ Проверка доступа к дням по дате

### Средний приоритет
- Admin Panel - MESSAGE, RULES, PLANS табы
- Frontend - список марафонов
- Frontend - страница дня
- Прогресс пользователя
- Email уведомления

### Низкий приоритет
- Конкурс (Contest)
- Комментарии
- Голосование за финалистов
- Объявление победителей
- Gift URL
- Auto Crop

---

## 📊 ПРОГРЕСС

**Текущая версия:** v1.2.0  
**Целевая версия для марафонов:** v2.0.0

### Статистика
- [ ] Backend Models: 0/3
- [ ] Backend Routes: 0/15
- [ ] Admin Pages: 0/2
- [ ] Frontend Pages: 0/3
- [ ] Интеграции: 0/2

---

## 🚀 НАЧАЛО РАБОТЫ

**Первый шаг:** Создать модели данных в Backend
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
# Создать файлы:
# - src/models/Marathon.model.ts
# - src/models/MarathonDay.model.ts
# - src/models/MarathonEnrollment.model.ts
```

**Команда для отслеживания прогресса:**
```bash
# Открыть этот файл
code MARATHON_TODO.md
# Отмечать выполненные задачи заменой [ ] на [x]
```

---

**Создано:** 20 января 2026 г.  
**Автор:** AI Assistant  
**Проект:** Rejuvena v2.0.0 - Marathon Feature
