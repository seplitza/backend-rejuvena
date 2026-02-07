# Rejuvena Backend & Frontend AI Agent Instructions

## Project Architecture

**Stack:** Node.js + Express + TypeScript + MongoDB + Next.js 14 (static export)

**Multi-Repository Structure:**
- **Backend Repo:** `backend-rejuvena` (`/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena`)
  - Backend API (port 9527)
  - Admin Panel (`admin-panel/` - React + Vite)
- **Frontend Repo (New):** `rejuvena` (`/Users/alexeipinaev/Documents/Rejuvena/web`)
  - Next.js 14.2.33 with static export
  - Deployed to GitHub Pages: https://seplitza.github.io/rejuvena/
  - New API + Exercises + Marathons + Premium
- **Frontend Repo (Old):** `Rejuvena_old_app` (создать через `create-old-app.sh`)
  - Next.js 14.2.33 with static export (version 1.1.0)
  - Deployed to GitHub Pages: https://seplitza.github.io/Rejuvena_old_app/
  - Azure API + Old Courses (for legacy users)

**Deployment:**
- Production Backend: http://37.252.20.170:9527 (PM2: `rejuvena-backend`)
- Frontend (New): https://seplitza.github.io/rejuvena/
- Frontend (Old): https://seplitza.github.io/Rejuvena_old_app/ (Azure courses)
- Admin Panel: https://api-rejuvena.duckdns.org/admin/

## Critical Workflow Rules

### 1. Git Commit ALWAYS Required
**NEVER** modify code without committing to Git. After ANY change:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena  # or web for frontend
git add -A
git commit -m "Description"
git push
```

### 2. Local Development First
User prefers testing locally before deployment to avoid "неточности":
```bash
# Backend (auto-restart)
cd Backend-rejuvena && npm run dev  # http://localhost:9527

# Frontend (hot reload)
cd web && npm run dev  # http://localhost:3000
```

### 3. Automated Deployment
- **Backend:** GitHub Actions auto-deploys on push to `main` → pulls on VPS → rebuilds → restarts PM2
- **Frontend:** GitHub Actions deploys to GitHub Pages via `peaceiris/actions-gh-pages@v3`
- Manual frontend deploy: `npm run build && npx gh-pages -d out -m "Deploy: description"`

### 4. Which Repository?
- Backend API changes (`src/models/`, `src/routes/`) → `backend-rejuvena`
- Admin Panel changes (`admin-panel/`) → `backend-rejuvena`
- User-facing app changes (`web/src/`) → `rejuvena` (web folder)
- Old app for Azure courses → `Rejuvena_old_app` (create via `./create-old-app.sh`)

## Key Models & API Patterns

### API Response Format Convention
**CRITICAL:** All admin endpoints return `{ success: true, data: {...} }` or `{ success: true, items: [...] }`
- Marathon list: `{ success: true, marathons: [...], pagination: {...} }`
- Exercise list: `{ success: true, exercises: [...] }`
- Always extract data from response object: `response.data.marathons` not `response.data`

### User Model (`src/models/User.model.ts`)
```typescript
{
  email: string (lowercase, unique)
  password: string (bcrypt)
  firstName?: string
  lastName?: string
  role: 'superadmin' | 'admin'
  isPremium?: boolean
  premiumEndDate?: Date
  isLegacyUser?: boolean  // For Azure migration
  azureUserId?: string
}
```

### Exercise Model (`src/models/Exercise.model.ts`)
```typescript
{
  title: string
  description: string
  content: string (rich HTML from TipTap)
  carouselMedia: IMedia[] (with order for sorting)
  tags: ObjectId[]
  isPremium?: boolean
  isPublished: boolean
}
```

### Marathon Model (`src/models/Marathon.model.ts`)
```typescript
{
  title: string
  description?: string  // Optional - admin panel doesn't always provide
  numberOfDays: number
  cost: number
  isPaid: boolean
  isPublic: boolean
  isDisplay: boolean
  hasContest: boolean
  language: 'ru' | 'en'
  startDate: Date
  welcomeMessage: string
  courseDescription: string
  rules: string
  tenure: number  // Total duration (learning + practice)
}
```

### Payment Flow (Alfabank)
1. POST `/api/payment/create` → Returns `paymentUrl` (Alfabank redirect)
2. User completes payment on Alfabank
3. Alfabank webhook → `/api/payment/callback`
4. Frontend polls `/api/payment/status/:orderId`
5. Success → Update `user.isPremium = true`, `premiumEndDate = +30 days`

### Marathon Enrollment & Email Notifications
- Email service: **Resend** (resend.com) - 100 emails/day free tier
- API Key stored in `.env`: `RESEND_API_KEY`
- From address: `noreply@mail.seplitza.ru`
- Automated daily notifications: PM2 cron job at 9:00 AM (`marathon-notifier` process)
- Email templates: enrollment, daily reminder, start, completion (see `src/services/email.service.ts`)

## Authentication Pattern

**Single JWT Token** for entire app (stored in localStorage `auth_token`):
- Frontend calls `/api/auth/login` or `/api/auth/register`
- Backend returns JWT with `{ userId, role }`
- All protected endpoints use `authMiddleware` (checks `Authorization: Bearer <token>`)

**API Base URL Detection** (`web/src/config/api.ts`):
```typescript
// Returns localhost:9527 in dev, 37.252.20.170:9527 in production
process.env.NEXT_PUBLIC_API_URL || 'http://37.252.20.170:9527'
```

## Production Deployment

### Backend Changes (Automated via GitHub Actions)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git add . && git commit -m "..." && git push
# GitHub Actions automatically: pulls → installs → builds backend & admin → restarts PM2
```

**Manual deployment (if GitHub Actions fails):**
```bash
ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && git stash && git pull && npm install && npm run build && cd admin-panel && npm install && npm run build && cd .. && pm2 restart rejuvena-backend"
```

### Frontend Changes (Automated via GitHub Actions)
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git add . && git commit -m "..." && git push
# GitHub Actions automatically builds and deploys to GitHub Pages
```

**Manual deployment:**
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run build
npx gh-pages -d out -m "Deploy: description"
```
**Note:** GitHub Pages has CDN cache (~5-15 min). Users may need hard refresh (Ctrl+Shift+R).

## Common Commands

```bash
# Database seeding (creates superadmin seplitza@gmail.com / 1234back)
npm run seed

# Import exercises from old Azure API
npm run import-exercises

# Send marathon notifications manually
npm run send-notifications

# Check PM2 status on production
ssh root@37.252.20.170 "pm2 list"

# View production logs
ssh root@37.252.20.170 "pm2 logs rejuvena-backend --lines 50"

# View marathon notification logs
ssh root@37.252.20.170 "pm2 logs marathon-notifier --lines 50"

# MongoDB connection (local)
mongosh mongodb://localhost:27017/rejuvena

# MongoDB connection (production)
ssh root@37.252.20.170 "mongosh mongodb://localhost:27017/rejuvena"

# Clean up failed marathon data
ssh root@37.252.20.170 "mongosh mongodb://localhost:27017/rejuvena --quiet --eval \"db.marathondays.deleteMany({ marathonId: ObjectId('ID') }); db.marathons.deleteOne({ _id: ObjectId('ID') })\""

# Create Rejuvena Old App (Azure courses)
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
./create-old-app.sh
```

## Project-Specific Conventions

1. **Case-Insensitive Email:** Always use `email.toLowerCase().trim()` when comparing
2. **Redux State Updates:** After profile updates, call `dispatch(setUser({...}))` to avoid page reload
3. **Payment Method Display:** Hardcoded to "Альфа-банк" (only provider)
4. **Activity Text Format:** "Оплата успешна: Премиум доступ" not "Премиум доступ"
5. **Guest Mode:** Check `isAuthenticated` before showing user-specific content (activity, profile)
6. **Premium Days Calculation:** `Math.max(0, Math.ceil((premiumEndDate - now) / (1000*60*60*24)))`
7. **Photo Diary Expiry:** 30 free days + 30 days per successful payment

## File Structure Landmarks

```
Backend-rejuvena/
├── src/
│   ├── models/          # Mongoose schemas (User, Exercise, Payment, Tag, Marathon)
│   ├── routes/          # Express endpoints (auth, exercise, media, payment, tag, marathon)
│   ├── middleware/      # JWT auth middleware
│   ├── services/        # Alfabank payment service, email service (Resend)
│   └── scripts/         # Data migration, seeding, marathon notifications
├── admin-panel/src/     # React admin panel (TipTap editor, drag-drop media)
│   ├── pages/           # MarathonList, MarathonEditor, ExerciseList, etc.
│   └── components/      # Layout, TipTapEditor, etc.
├── uploads/             # Uploaded media files (images, videos)
├── ecosystem.config.json # PM2 config (backend + marathon-notifier cron)
└── .github/workflows/   # GitHub Actions deployment automation

web/src/
├── pages/               # Next.js pages (dashboard, exercises, profile, payment, marathons)
│   └── marathons/       # Marathon list, detail, day pages
├── store/               # Redux slices (auth, payment)
├── config/api.ts        # API URL configuration
└── components/          # React components (PaymentModal, day/ExerciseItem, etc.)
```

## Documentation Files

- `QUICKSTART.md` - Fast dev setup
- `DEPLOYMENT_WORKFLOW.md` - Complete deployment guide
- `PAYMENT-TESTING.md` - Alfabank test cards
- `FRONTEND_INTEGRATION.md` - API integration patterns
- `PROJECT_SUMMARY.md` - Feature overview
- `MARATHON_COMPLETE.md` - Marathon system documentation
- `MARATHON_EMAIL_NOTIFICATIONS.md` - Email automation guide
- `PRODUCTION_EMAIL_SETUP.md` - Resend setup instructions
- `ORDERS_PAGE_GUIDE.md` - Admin orders/payments page

## Common Pitfalls

❌ Don't use `response.data` directly - check API format (`response.data.marathons`, `response.data.exercises`)  
❌ Don't forget to refresh Redux after API calls that change user state  
❌ Don't show activity/profile sections to guests (wrap in `{isAuthenticated && ...}`)  
❌ Don't hardcode `http://localhost:9527` - use `process.env.NEXT_PUBLIC_API_URL`  
❌ Don't deploy without testing locally first (user request)  
❌ Don't create new documentation files after changes unless explicitly requested  
❌ Don't forget to rebuild admin panel after changes: `cd admin-panel && npm run build`  
❌ Don't use `git pull` on production without `git stash` first (local changes may exist)
