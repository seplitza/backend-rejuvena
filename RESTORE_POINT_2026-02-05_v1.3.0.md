# Restore Point: v1.3.0 - Landing Marathon Sales
**Date:** 5 февраля 2026, 15:45
**Backend Version:** 1.3.0
**Frontend Version:** 1.2.0

## ✅ Working Features

### Landing Page Marathon Sales (NEW)
- ✅ Direct marathon purchase from landing page
- ✅ MarathonRegistrationModal for unauthenticated users
- ✅ Email collection → Auto-registration → Payment redirect
- ✅ Marathon ID extraction from populated MongoDB objects
- ✅ Backend `/api/payment/create` handles both marathons and premium

### Admin Panel
- ✅ Landing page editor with WYSIWYG
- ✅ Section duplication with proper editor modal
- ✅ Marathon dropdowns correctly save/load IDs
- ✅ TipTap rich text editor for content sections
- ✅ Media upload with drag-drop carousel ordering

### Backend
- ✅ Mongoose `.toObject()` returns dynamic fields (copied sections)
- ✅ Marathon payments support in unified `/create` endpoint
- ✅ Alfabank payment integration
- ✅ Email notifications via Resend
- ✅ Marathon enrollment automation

### Frontend
- ✅ Landing pages render correctly at `/landing/[slug]`
- ✅ Marathon purchase buttons pass correct IDs
- ✅ extractMarathonId() helper handles populated objects
- ✅ Guest users can purchase marathons
- ✅ Premium/Photo-diary payments work

## Git Tags
- Backend: `v1.3.0` (commit c7ba5ed)
- Frontend: `v1.2.0` (commit 243c85c)

## Production URLs
- Backend API: http://37.252.20.170:9527
- Admin Panel: https://api-rejuvena.duckdns.org/admin/
- Frontend: https://seplitza.github.io/rejuvena/

## Key Changes Since v1.2.0

### Backend (v1.2.0 → v1.3.0)
1. **Payment Routes** (`src/routes/payment.routes.ts`):
   - Added marathon payment handling in `/create` endpoint
   - Checks `type === 'marathon'` or `planType === 'marathon'`
   - Fetches marathon price from database
   - No longer requires `amount`/`description` for marathons

2. **Landing Routes** (`src/routes/landing.routes.ts`):
   - Replaced `.lean()` with `.toObject()` for GET /admin/:id
   - Now returns dynamic fields (copied sections like `featuresSection_123`)

3. **Admin Panel** (`admin-panel/src/pages/LandingEditor.tsx`):
   - Fixed section editor modal for copied sections
   - Extracts `baseType` from `section.id.split('-copy-')[0]`
   - Auto-closes modal after save with `setEditingSection(null)`
   - Added logging for debugging section data

### Frontend (v1.1.0 → v1.2.0)
1. **Landing Page** (`web/src/pages/landing/[slug].tsx`):
   - Added `extractMarathonId()` helper function
   - Handles both string IDs and populated objects
   - Fixed marathon purchase buttons to pass correct ID

2. **Marathon Registration Modal** (`web/src/components/landing/MarathonRegistrationModal.tsx`):
   - Quick registration flow for guests
   - Email → `/api/auth/register-and-pay` → `/api/payment/create`
   - Redirects to Alfabank payment page

## Database Schema
- **Landing Model**: `strict: false` allows dynamic fields
- **Marathon Model**: Has `cost` field used for payment amount
- **Payment Model**: `metadata.type = 'marathon'` for marathon purchases

## Environment Variables
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/rejuvena
ALFABANK_USERNAME=...
ALFABANK_PASSWORD=...
RESEND_API_KEY=...
JWT_SECRET=...

# Frontend (NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=http://37.252.20.170:9527
```

## Known Issues (Fixed)
- ❌ ~~Marathon ID showing as [object Object]~~ → Fixed with extractMarathonId()
- ❌ ~~"Amount and description required" error~~ → Fixed with marathon check
- ❌ ~~Copied sections not loading~~ → Fixed with .toObject()
- ❌ ~~Editor modal not found for copies~~ → Fixed with baseType extraction

## Deployment Commands

### Backend
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena
git pull
npm install
npm run build
cd admin-panel && npm install && npm run build && cd ..
ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && git pull && npm install && npm run build && cd admin-panel && npm install && npm run build && cd .. && pm2 restart rejuvena-backend"
```

### Frontend
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git pull
npm install
rm -rf .next out
npm run build
npx gh-pages -d out -m "Deploy v1.2.0"
```

## Rollback Instructions

### Backend to v1.2.0
```bash
ssh root@37.252.20.170 "cd /var/www/rejuvena-backend && git checkout v1.2.0 && npm install && npm run build && cd admin-panel && npm install && npm run build && cd .. && pm2 restart rejuvena-backend"
```

### Frontend to v1.1.0
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git checkout v1.1.0
npm install
npm run build
npx gh-pages -d out -m "Rollback to v1.1.0"
```

## Testing Checklist
- [x] Landing page loads at `/landing/omolodis-stage-7-2280`
- [x] Marathon purchase buttons work
- [x] Guest registration modal appears
- [x] Payment redirects to Alfabank
- [x] Admin panel: copy section → edit → save → loads correctly
- [x] Marathon dropdowns show selected marathons

## Support Contacts
- Telegram: @seplitza_support
- Admin: seplitza@gmail.com
