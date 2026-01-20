#!/bin/bash

# Deploy Marathon Frontend to GitHub Pages
# This script must be run from the web repository

set -e

echo "🚀 Deploying Marathon Frontend to GitHub Pages"
echo "=============================================="
echo ""

# Check if we're in the web repository
if [ ! -f "next.config.js" ]; then
  echo "❌ Error: This script must be run from the /web directory"
  echo "   cd /Users/alexeipinaev/Documents/Rejuvena/web"
  exit 1
fi

BACKEND_DIR="../Backend-rejuvena"

if [ ! -d "$BACKEND_DIR/docs/frontend" ]; then
  echo "❌ Error: Backend frontend docs not found"
  exit 1
fi

echo "✅ In correct directory"
echo ""

# Step 1: Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/pages/marathons/\[id\]/day
mkdir -p src/types
echo "✅ Directories created"
echo ""

# Step 2: Copy marathon page files
echo "📄 Copying page files..."

if [ -f "$BACKEND_DIR/docs/frontend/pages/marathons.tsx" ]; then
  cp "$BACKEND_DIR/docs/frontend/pages/marathons.tsx" src/pages/marathons/index.tsx
  echo "  ✓ marathons/index.tsx"
else
  echo "  ✗ marathons.tsx not found"
fi

if [ -f "$BACKEND_DIR/docs/frontend/pages/marathon-detail.tsx" ]; then
  cp "$BACKEND_DIR/docs/frontend/pages/marathon-detail.tsx" src/pages/marathons/\[id\].tsx
  echo "  ✓ marathons/[id].tsx"
else
  echo "  ✗ marathon-detail.tsx not found"
fi

if [ -f "$BACKEND_DIR/docs/frontend/pages/marathon-day.tsx" ]; then
  cp "$BACKEND_DIR/docs/frontend/pages/marathon-day.tsx" src/pages/marathons/\[id\]/day/\[dayNumber\].tsx
  echo "  ✓ marathons/[id]/day/[dayNumber].tsx"
else
  echo "  ✗ marathon-day.tsx not found"
fi

echo ""

# Step 3: Create TypeScript types
echo "📝 Creating TypeScript types..."
cat > src/types/marathon.ts << 'EOF'
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
  exercises: string[];
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
EOF
echo "  ✓ src/types/marathon.ts"
echo ""

# Step 4: Update PaymentModal if needed
echo "💳 Checking PaymentModal..."
if [ -f "src/components/PaymentModal.tsx" ]; then
  echo "  ⚠ PaymentModal exists - manual merge may be needed"
  echo "  📄 Updated version available at: $BACKEND_DIR/docs/frontend/components/PaymentModalUpdated.tsx"
else
  if [ -f "$BACKEND_DIR/docs/frontend/components/PaymentModalUpdated.tsx" ]; then
    cp "$BACKEND_DIR/docs/frontend/components/PaymentModalUpdated.tsx" src/components/PaymentModal.tsx
    echo "  ✓ PaymentModal.tsx created"
  fi
fi
echo ""

# Step 5: Git commit
echo "📦 Committing changes..."
git add -A
git commit -m "Add marathon pages: list, detail, and day views

- Added marathons listing page (index.tsx)
- Added marathon detail page with tabs ([id].tsx)
- Added marathon day page with exercises ([id]/day/[dayNumber].tsx)
- Added TypeScript types for Marathon, MarathonDay, MarathonEnrollment
- Updated PaymentModal to support marathon payments

Integrates with backend API at http://37.252.20.170:9527"

echo "✅ Changes committed"
echo ""

# Step 6: Build
echo "🔨 Building Next.js project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed - please fix errors before deploying"
  exit 1
fi
echo "✅ Build successful"
echo ""

# Step 7: Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npx gh-pages -d out -m "Deploy marathon feature to production"

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  exit 1
fi
echo "✅ Deployment successful"
echo ""

# Step 8: Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"
echo ""

echo "🎉 Marathon frontend deployed successfully!"
echo ""
echo "🌐 Live URLs:"
echo "   - Marathons: https://seplitza.github.io/rejuvena/marathons"
echo "   - Backend API: http://37.252.20.170:9527/api/marathons"
echo ""
echo "⏱ Note: GitHub Pages CDN may take 5-15 minutes to update"
echo "   Try hard refresh (Cmd+Shift+R) if not updated immediately"
