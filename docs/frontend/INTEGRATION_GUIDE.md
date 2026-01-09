# Интеграция премиум логики для упражнений

## Обзор

Система премиум доступа к упражнениям с тремя уровнями:
- **Бесплатно** (6 упражнений): тег "На здоровье"
- **Базовое** (100₽, 28 упражнений): тег "Базовое"
- **PRO** (200₽, 23 упражнений): теги "Продвинутое" или "PRO"

## Файлы для копирования

1. **PaymentModal.tsx** → `web/src/components/PaymentModal.tsx`
2. **exerciseAccess.ts** → `web/src/utils/exerciseAccess.ts`

## Интеграция в exercises.tsx

```tsx
import { useState } from 'react';
import PaymentModal from '@/components/PaymentModal';
import { getExerciseAccess, hasUserAccess } from '@/utils/exerciseAccess';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPremiumExercise, setSelectedPremiumExercise] = useState<{
    name: string;
    price: number;
    isPro: boolean;
  } | null>(null);

  const handleExerciseClick = (exercise: Exercise) => {
    const access = getExerciseAccess(exercise.tags);
    
    // Check if exercise is locked and user hasn't purchased it
    if (access.isLocked && !hasUserAccess(exercise.exerciseName)) {
      setSelectedPremiumExercise({
        name: exercise.exerciseName,
        price: access.price,
        isPro: access.isPro
      });
      setPaymentModalOpen(true);
      return;
    }
    
    // Open exercise detail
    router.push(`/exercise/${exercise.id}`);
  };

  return (
    <div>
      {/* Exercise list with lock icons */}
      {exercises.map(exercise => {
        const access = getExerciseAccess(exercise.tags);
        const hasAccess = !access.isLocked || hasUserAccess(exercise.exerciseName);
        
        return (
          <div key={exercise.id} onClick={() => handleExerciseClick(exercise)}>
            <h3>{exercise.exerciseName}</h3>
            
            {/* Show badge */}
            {access.badge && (
              <span className={access.isPro ? 'badge-pro' : 'badge-basic'}>
                {access.badge}
              </span>
            )}
            
            {/* Show lock icon if locked */}
            {!hasAccess && (
              <svg className="lock-icon">🔒</svg>
            )}
          </div>
        );
      })}

      {/* Payment Modal */}
      {selectedPremiumExercise && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPremiumExercise(null);
          }}
          exerciseName={selectedPremiumExercise.name}
          price={selectedPremiumExercise.price}
          isPro={selectedPremiumExercise.isPro}
        />
      )}
    </div>
  );
}
```

## Интеграция в exercise/[exerciseId].tsx

```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PaymentModal from '@/components/PaymentModal';
import { getExerciseAccess, hasUserAccess } from '@/utils/exerciseAccess';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const { exerciseId } = router.query;
  const [exercise, setExercise] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!exercise) return;

    const access = getExerciseAccess(exercise.tags);
    
    // Redirect if locked and not purchased
    if (access.isLocked && !hasUserAccess(exercise.exerciseName)) {
      setShowPaymentModal(true);
    }
  }, [exercise]);

  const access = getExerciseAccess(exercise?.tags);
  const hasAccess = !access.isLocked || hasUserAccess(exercise?.exerciseName);

  return (
    <div>
      {/* Content with blur effect if locked */}
      <div className={!hasAccess ? 'blur-lg' : ''}>
        <h1>{exercise?.exerciseName}</h1>
        <video src={exercise?.videoUrl} />
        <div dangerouslySetInnerHTML={{ __html: exercise?.description }} />
      </div>

      {/* Lock overlay */}
      {!hasAccess && (
        <div className="lock-overlay">
          <div className="lock-message">
            <svg className="lock-icon-large">🔒</svg>
            <h2>Премиум упражнение</h2>
            <p>Это {access.isPro ? 'PRO' : 'базовое'} упражнение</p>
            <button onClick={() => setShowPaymentModal(true)}>
              Купить за {access.price}₽
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        exerciseName={exercise?.exerciseName || ''}
        price={access.price}
        isPro={access.isPro}
      />
    </div>
  );
}
```

## CSS стили

Добавьте в ваш `globals.css` или Tailwind config:

```css
/* Lock overlay */
.lock-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.lock-message {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  max-width: 400px;
}

/* Badge styles */
.badge-basic {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: linear-gradient(to right, #9333ea, #ec4899);
  color: white;
}

.badge-pro {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: linear-gradient(to right, #f59e0b, #eab308);
  color: #78350f;
}
```

## Тестирование

1. Откройте браузер консоль (F12)
2. Проверьте покупки:
```javascript
// Проверить текущие покупки
JSON.parse(localStorage.getItem('exercisePurchases') || '[]')

// Добавить покупку вручную
const purchases = JSON.parse(localStorage.getItem('exercisePurchases') || '[]');
purchases.push('Название упражнения');
localStorage.setItem('exercisePurchases', JSON.stringify(purchases));

// Очистить все покупки
localStorage.removeItem('exercisePurchases');
```

## Следующие шаги

1. **Интеграция платежной системы**:
   - YooKassa (для РФ)
   - Stripe (международные платежи)
   - Тинькофф Касса

2. **Backend API для платежей**:
```typescript
// POST /api/payments/create
// POST /api/payments/verify
// GET /api/user/purchases
```

3. **Аутентификация пользователей**:
   - Заменить localStorage на backend API
   - Сохранять покупки в БД
   - Синхронизация между устройствами

## Статистика

- Всего упражнений: **57**
- Бесплатных: **6** (На здоровье)
- Базовых (100₽): **28** (Базовое)
- PRO (200₽): **23** (Продвинутое/PRO)

## API endpoints

```
GET /api/exercises/public - получить все опубликованные упражнения
GET /api/exercises/public/:id - получить одно упражнение
```

Каждое упражнение содержит:
```typescript
{
  _id: string;
  title: string;
  description: string;
  content: string;
  carouselMedia: Array<{
    url: string;
    type: 'image' | 'video';
    filename: string;
    order: number;
  }>;
  tags: Array<{
    _id: string;
    name: string; // "На здоровье", "Базовое", "Продвинутое", "PRO"
    slug: string;
    color: string;
  }>;
  isPublished: boolean;
}
```
