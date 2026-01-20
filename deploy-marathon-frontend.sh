#!/bin/bash

# Marathon Frontend Deployment Script
# Автоматически копирует файлы из Backend-rejuvena/docs/frontend в web/src
# и деплоит на GitHub Pages

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths
BACKEND_DIR="/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena"
WEB_DIR="/Users/alexeipinaev/Documents/Rejuvena/web"
DOCS_FRONTEND="${BACKEND_DIR}/docs/frontend"

echo -e "${BLUE}🏃 Marathon Frontend Deployment${NC}"
echo "================================"
echo ""

# Step 1: Check directories exist
echo -e "${YELLOW}1️⃣ Checking directories...${NC}"

if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
  exit 1
fi

if [ ! -d "$WEB_DIR" ]; then
  echo -e "${RED}❌ Web directory not found: $WEB_DIR${NC}"
  exit 1
fi

if [ ! -d "$DOCS_FRONTEND" ]; then
  echo -e "${RED}❌ Frontend docs not found: $DOCS_FRONTEND${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All directories found${NC}"
echo ""

# Step 2: Navigate to web directory
echo -e "${YELLOW}2️⃣ Navigating to web directory...${NC}"
cd "$WEB_DIR"
echo -e "${GREEN}✅ Current directory: $(pwd)${NC}"
echo ""

# Step 3: Create directory structure
echo -e "${YELLOW}3️⃣ Creating directory structure...${NC}"

mkdir -p src/pages/marathons/\[id\]/day
echo "   Created: src/pages/marathons/[id]/day"

mkdir -p src/types
echo "   Created: src/types"

echo -e "${GREEN}✅ Directory structure ready${NC}"
echo ""

# Step 4: Copy page files
echo -e "${YELLOW}4️⃣ Copying page files...${NC}"

# Marathons list
if [ -f "${DOCS_FRONTEND}/pages/marathons.tsx" ]; then
  cp "${DOCS_FRONTEND}/pages/marathons.tsx" src/pages/marathons/index.tsx
  echo -e "   ${GREEN}✓${NC} Copied: marathons/index.tsx"
else
  echo -e "   ${RED}✗${NC} Not found: marathons.tsx"
fi

# Marathon detail
if [ -f "${DOCS_FRONTEND}/pages/marathon-detail.tsx" ]; then
  cp "${DOCS_FRONTEND}/pages/marathon-detail.tsx" src/pages/marathons/\[id\].tsx
  echo -e "   ${GREEN}✓${NC} Copied: marathons/[id].tsx"
else
  echo -e "   ${RED}✗${NC} Not found: marathon-detail.tsx"
fi

# Marathon day
if [ -f "${DOCS_FRONTEND}/pages/marathon-day.tsx" ]; then
  cp "${DOCS_FRONTEND}/pages/marathon-day.tsx" src/pages/marathons/\[id\]/day/\[dayNumber\].tsx
  echo -e "   ${GREEN}✓${NC} Copied: marathons/[id]/day/[dayNumber].tsx"
else
  echo -e "   ${RED}✗${NC} Not found: marathon-day.tsx"
fi

echo ""

# Step 5: Copy PaymentModal (optional - with backup)
echo -e "${YELLOW}5️⃣ Updating PaymentModal...${NC}"

if [ -f "src/components/PaymentModal.tsx" ]; then
  # Backup existing
  cp src/components/PaymentModal.tsx src/components/PaymentModal.tsx.backup
  echo -e "   ${BLUE}ℹ${NC} Backed up existing PaymentModal.tsx"
  
  read -p "   Replace PaymentModal with updated version? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "${DOCS_FRONTEND}/components/PaymentModalUpdated.tsx" ]; then
      cp "${DOCS_FRONTEND}/components/PaymentModalUpdated.tsx" src/components/PaymentModal.tsx
      echo -e "   ${GREEN}✓${NC} Replaced PaymentModal.tsx"
    else
      echo -e "   ${RED}✗${NC} PaymentModalUpdated.tsx not found"
    fi
  else
    echo -e "   ${YELLOW}⊘${NC} Skipped PaymentModal replacement"
    echo -e "   ${BLUE}ℹ${NC} Manually merge marathon support into PaymentModal"
  fi
else
  # No existing PaymentModal, just copy
  if [ -f "${DOCS_FRONTEND}/components/PaymentModalUpdated.tsx" ]; then
    cp "${DOCS_FRONTEND}/components/PaymentModalUpdated.tsx" src/components/PaymentModal.tsx
    echo -e "   ${GREEN}✓${NC} Created PaymentModal.tsx"
  fi
fi

echo ""

# Step 6: Copy type definitions
echo -e "${YELLOW}6️⃣ Copying type definitions...${NC}"

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

echo -e "   ${GREEN}✓${NC} Created: src/types/marathon.ts"
echo ""

# Step 7: Check for errors
echo -e "${YELLOW}7️⃣ Checking for TypeScript errors...${NC}"

if command -v npm &> /dev/null; then
  echo "   Running type check..."
  if npm run type-check 2>/dev/null || npm run build -- --dry-run 2>/dev/null; then
    echo -e "   ${GREEN}✓${NC} No TypeScript errors"
  else
    echo -e "   ${YELLOW}⚠${NC} TypeScript errors detected - check manually"
  fi
else
  echo -e "   ${YELLOW}⚠${NC} npm not found - skipping type check"
fi

echo ""

# Step 8: Summary
echo -e "${GREEN}✅ Files copied successfully!${NC}"
echo ""
echo "📁 Created files:"
echo "   - src/pages/marathons/index.tsx"
echo "   - src/pages/marathons/[id].tsx"
echo "   - src/pages/marathons/[id]/day/[dayNumber].tsx"
echo "   - src/types/marathon.ts"
echo ""

# Step 9: Next steps
echo -e "${BLUE}📋 Next steps:${NC}"
echo "   1. Review copied files and fix imports if needed"
echo "   2. Test locally: npm run dev"
echo "   3. Build: npm run build"
echo "   4. Commit: git add -A && git commit -m 'Add marathon pages'"
echo "   5. Deploy: npm run build && npx gh-pages -d out"
echo ""

# Step 10: Ask if user wants to continue with build
read -p "Run 'npm run dev' to test locally? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}🚀 Starting development server...${NC}"
  npm run dev
else
  echo -e "${GREEN}Done! Follow the next steps manually.${NC}"
fi
