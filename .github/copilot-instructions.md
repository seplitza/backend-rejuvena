# Rejuvena Backend & Frontend AI Agent Instructions

## Project Architecture

**Stack:** Node.js + Express + TypeScript + MongoDB + Next.js 14 (static export)

**Dual Repository Structure:**
- **Backend Repo:** `backend-rejuvena` (`/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena`)
  - Backend API (port 9527)
  - Admin Panel (`admin-panel/` - React + Vite)
- **Frontend Repo:** `rejuvena` (`/Users/alexeipinaev/Documents/Rejuvena/web`)
  - Next.js 14.2.33 with static export
  - Deployed to GitHub Pages: https://seplitza.github.io/rejuvena/

**Deployment:**
- Production Backend: http://37.252.20.170:9527 (PM2: `rejuvena-backend`)
- Frontend: https://seplitza.github.io/rejuvena/
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

### 3. Which Repository?
- Backend API changes (`src/models/`, `src/routes/`) → `backend-rejuvena`
- Admin Panel changes (`admin-panel/`) → `backend-rejuvena`
- User-facing app changes (`web/src/`) → `rejuvena` (web folder)

## Key Models & API Patterns

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

### Payment Flow (Alfabank)
1. POST `/api/payment/create` → Returns `paymentUrl` (Alfabank redirect)
2. User completes payment on Alfabank
3. Alfabank webhook → `/api/payment/callback`
4. Frontend polls `/api/payment/status/:orderId`
5. Success → Update `user.isPremium = true`, `premiumEndDate = +30 days`

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

### Backend Changes
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git add . && git commit -m "..." && git push
ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && git pull && npm install && npm run build && pm2 restart rejuvena-backend"
```

### Frontend Changes
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git add . && git commit -m "..." && git push
npm run build
npx gh-pages -d out -m "Deploy: description"
```
**Note:** GitHub Pages has CDN cache (~5-15 min). Users may need hard refresh.

## Common Commands

```bash
# Database seeding (creates superadmin seplitza@gmail.com / 1234back)
npm run seed

# Import exercises from old Azure API
npm run import-exercises

# Check PM2 status on production
ssh root@37.252.20.170 "pm2 list"

# View production logs
ssh root@37.252.20.170 "pm2 logs rejuvena-backend --lines 50"

# MongoDB connection
mongosh mongodb://localhost:27017/rejuvena
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
│   ├── models/          # Mongoose schemas (User, Exercise, Payment, Tag)
│   ├── routes/          # Express endpoints (auth, exercise, media, payment, tag)
│   ├── middleware/      # JWT auth middleware
│   ├── services/        # Alfabank payment service
│   └── scripts/         # Data migration & seeding scripts
├── admin-panel/src/     # React admin panel (TipTap editor, drag-drop media)
├── uploads/             # Uploaded media files (images, videos)
└── ecosystem.config.json # PM2 production config

web/src/
├── pages/               # Next.js pages (dashboard, exercises, profile, payment)
├── store/               # Redux slices (auth, payment)
├── config/api.ts        # API URL configuration
└── components/          # React components
```

## Documentation Files

- `QUICKSTART.md` - Fast dev setup
- `DEPLOYMENT_WORKFLOW.md` - Complete deployment guide
- `PAYMENT-TESTING.md` - Alfabank test cards
- `FRONTEND_INTEGRATION.md` - API integration patterns
- `PROJECT_SUMMARY.md` - Feature overview

## Common Pitfalls

❌ Don't use `response.data` with payment history - it's `response.payments`  
❌ Don't forget to refresh Redux after API calls that change user state  
❌ Don't show activity/profile sections to guests (wrap in `{isAuthenticated && ...}`)  
❌ Don't hardcode `http://localhost:9527` - use `process.env.NEXT_PUBLIC_API_URL`  
❌ Don't deploy without testing locally first (user request)  
❌ Don't create new documentation files after changes unless explicitly requested
