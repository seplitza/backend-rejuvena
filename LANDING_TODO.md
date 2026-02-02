# Landing System TODO List

## Прогресс: 4/10 задач выполнено ✅

---

## ✅ Выполнено

### Этап 1: Backend
- [x] **Backend: Создать модель Landing с TypeScript интерфейсом**
  - Файл: `src/models/Landing.model.ts`
  - Секции: hero, marathons, benefits, testimonials, CTA, custom
  - Счетчики: views, conversions
  - Связь с марафонами через ObjectId

- [x] **Backend: CRUD API endpoints для лендингов (/api/landings)**
  - Файл: `src/routes/landing.routes.ts`
  - Endpoints: GET, POST, PUT, PATCH, DELETE
  - Защищено authMiddleware
  - Фильтрация, пагинация, поиск

- [x] **Backend: Публичный endpoint GET /api/landings/:slug**
  - `GET /api/landings/public/:slug` - для фронтенда
  - `POST /api/landings/public/:slug/conversion` - трекинг

### Этап 2: Admin Panel (частично)
- [x] **Admin Panel: Страница списка лендингов /admin/landings**
  - Файл: `admin-panel/src/pages/LandingList.tsx`
  - Фильтры: статус, поиск
  - Действия: редактировать, публиковать, удалить, открыть
  - Пагинация
  - Пункт меню в Layout

---

## 🔨 В работе

### Этап 2: Admin Panel (продолжение)
- [ ] **Admin Panel: Редактор лендинга с секциями**
  - Файл: `admin-panel/src/pages/LandingEditor.tsx`
  - Форма для всех секций (hero, marathons, benefits, etc.)
  - Выбор марафонов из выпадающего списка
  - TipTap для custom HTML секций
  - Превью изменений

- [ ] **Admin Panel: Превью лендинга в модальном окне**
  - Компонент: `admin-panel/src/components/LandingPreview.tsx`
  - Рендеринг всех секций как во фронтенде
  - Открывается из редактора
  - Mobile/Desktop view toggle

---

## 📝 Ожидает выполнения

### Этап 3: Frontend Рендеринг
- [ ] **Frontend: Создать шаблон /landing/[slug] на Next.js**
  - Файл: `web/src/pages/landing/[slug].tsx`
  - SSG через getStaticPaths + getStaticProps
  - SEO meta tags из landing.metaDescription + ogImage
  - Интеграция с API `/api/landings/public/:slug`

- [ ] **Frontend: Компоненты для рендеринга секций лендинга**
  - `web/src/components/landing/HeroSection.tsx`
  - `web/src/components/landing/MarathonsSection.tsx`
  - `web/src/components/landing/BenefitsSection.tsx`
  - `web/src/components/landing/TestimonialsSection.tsx`
  - `web/src/components/landing/CtaSection.tsx`
  - Адаптация стилей из longevity-landing

### Этап 4: Deploy
- [ ] **Deploy: Настроить деплой лендингов на production**
  - Обновить GitHub Actions для Next.js SSG
  - Проверить revalidate для ISR
  - Настроить переменные окружения
  - Тест на production: https://seplitza.github.io/rejuvena/landing/marathon-7

### Этап 5: Testing
- [ ] **Testing: Создать тестовый лендинг для Марафона 7**
  - Slug: `marathon-7`
  - Базовый марафон: ID (9 февраля старт)
  - Продвинутый марафон: ID (23 февраля старт)
  - Контент из `marathon-texts/course-description-short.md`
  - Превью + публикация

---

## 📌 Дополнительные задачи

### Улучшения (опционально)
- [ ] Drag-and-drop для custom секций (изменение порядка)
- [ ] Клонирование существующих лендингов
- [ ] A/B тестирование (две версии одного лендинга)
- [ ] Аналитика: графики просмотров и конверсий
- [ ] Email-захват прямо с лендинга
- [ ] Интеграция с UTM метками

---

## 🔗 Полезные ссылки

- Backend API: http://localhost:9527/api/landings
- Admin Panel: http://localhost:9527/admin/landings
- Production Admin: https://api-rejuvena.duckdns.org/admin/landings
- Frontend (future): https://seplitza.github.io/rejuvena/landing/[slug]

---

**Последнее обновление:** 2 февраля 2026
**Статус:** Backend готов, Admin Panel - в разработке

## Future Optimization

- [ ] **SSG Optimization**: Convert landing pages to Static Site Generation
  - Преимущества: Faster initial load, better SEO, less backend load
  - Требуется: Refactor component to use props from getStaticProps instead of client-side fetch
  - Текущее: Works with CSR (client-side rendering), fully functional
  - Priority: Medium (current implementation works fine)

