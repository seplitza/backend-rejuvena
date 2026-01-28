# Frontend Payment & Marathon Updates

## Изменения для улучшения отображения платежей и марафонов

### 1. История платежей - форматирование названий продуктов

В файле `web/src/pages/dashboard.tsx` добавьте:

```typescript
// Добавить в интерфейс Payment (обычно в начале файла или в types файле):
interface Payment {
  id: string;
  orderNumber: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  metadata?: {
    type?: 'premium' | 'marathon' | 'exercise';
    planType?: string;
    duration?: number;
    marathonId?: string;
    marathonName?: string;
    exerciseId?: string;
    exerciseName?: string;
  };
}

// Добавить функцию для форматирования названия продукта:
const formatProductName = (payment: Payment): string => {
  const meta = payment.metadata;
  if (!meta) return 'Покупка';
  
  if (meta.type === 'premium' || meta.planType === 'premium') {
    return 'Покупка: Премиум доступ';
  }
  
  if (meta.type === 'marathon' && meta.marathonName) {
    return `Покупка: ${meta.marathonName}`;
  }
  
  if (meta.type === 'exercise' && meta.exerciseName) {
    return `Покупка: ${meta.exerciseName}`;
  }
  
  return 'Покупка';
};

// В секции "Последняя активность" замените:
// БЫЛО:
<div className="text-sm text-gray-600">
  {payment.metadata?.planType === 'premium' 
    ? `Премиум доступ на ${payment.metadata.duration} дней` 
    : payment.description}
</div>

// СТАЛО:
<div className="text-sm text-gray-600">
  {formatProductName(payment)}
</div>
```

### 2. Карточки марафонов - бейдж "Оплачено" и кнопка перехода

В компоненте карточек марафонов (обычно `MarathonCard.tsx` или внутри `dashboard.tsx`):

```typescript
// Обновить интерфейс Marathon:
interface Marathon {
  _id: string;
  title: string;
  description?: string;
  numberOfDays: number;
  cost: number;
  isPaid: boolean;
  startDate: string;
  // НОВЫЕ ПОЛЯ:
  userEnrolled?: boolean;
  userEnrollmentStatus?: 'pending' | 'active' | 'completed' | 'cancelled';
}

// В функции загрузки марафонов добавить Authorization header:
const fetchMarathons = async () => {
  try {
    const headers: any = { 'Content-Type': 'application/json' };
    
    // Если пользователь авторизован, добавляем токен
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/marathons`, { headers });
    const data = await response.json();
    
    if (data.success) {
      setMarathons(data.marathons);
    }
  } catch (error) {
    console.error('Failed to fetch marathons:', error);
  }
};

// В рендере карточки марафона добавить:
<div className="marathon-card">
  {/* Заголовок марафона */}
  <h3>{marathon.title}</h3>
  
  {/* НОВЫЙ: Бейдж статуса оплаты */}
  {marathon.userEnrolled && (
    <div className="mb-4">
      <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-200">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Оплачено
      </span>
    </div>
  )}
  
  {/* Описание и другой контент */}
  <p>{marathon.description}</p>
  
  {/* ОБНОВЛЕННАЯ: Кнопка действия */}
  {marathon.userEnrolled ? (
    <button
      onClick={() => router.push(`/marathons/${marathon._id}`)}
      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
    >
      Перейти к марафону →
    </button>
  ) : (
    <button
      onClick={() => handleMarathonClick(marathon._id)}
      className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
    >
      Подробнее
    </button>
  )}
</div>
```

### 3. Страница марафона - таймер и правила до начала

В файле `web/src/pages/marathons/[id].tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CountdownTimer from '@/components/CountdownTimer'; // НОВЫЙ ИМПОРТ

export default function MarathonDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [marathon, setMarathon] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Функция проверки статуса марафона
  const getMarathonStatus = () => {
    if (!marathon) return { hasStarted: false, isFinished: false, start: new Date(), end: new Date() };
    
    const now = new Date();
    const start = new Date(marathon.startDate);
    const end = new Date(start.getTime() + marathon.tenure * 24 * 60 * 60 * 1000);
    
    return {
      hasStarted: now >= start,
      isFinished: now > end,
      start,
      end
    };
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchMarathon = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/marathons/${id}`, { headers });
        const data = await response.json();
        
        if (data.success) {
          setMarathon(data.marathon);
          
          // Проверяем запись пользователя
          if (data.marathon.userEnrolled) {
            const enrollmentResp = await fetch(`${API_URL}/api/marathons/${id}/enrollment`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const enrollData = await enrollmentResp.json();
            if (enrollData.success) {
              setEnrollment(enrollData.enrollment);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load marathon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarathon();
  }, [id]);

  // Если марафон начался и пользователь записан - редирект на первый день
  useEffect(() => {
    if (enrollment && marathon) {
      const status = getMarathonStatus();
      if (status.hasStarted && !status.isFinished) {
        router.push(`/marathons/${id}/day/1`);
      }
    }
  }, [enrollment, marathon, id, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  if (!marathon) {
    return <div className="flex items-center justify-center min-h-screen">Марафон не найден</div>;
  }

  const status = getMarathonStatus();

  // ВАЖНО: Если марафон еще не начался и пользователь записан - показываем страницу ожидания
  if (enrollment && !status.hasStarted) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Кнопка "Назад" */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center text-purple-600 hover:text-purple-700 font-semibold"
        >
          ← Вернуться на главную
        </button>

        {/* Timer */}
        <CountdownTimer 
          targetDate={status.start} 
          onComplete={() => router.reload()} 
        />

        {/* Welcome Message */}
        {marathon.welcomeMessage && (
          <div className="bg-white rounded-2xl shadow-lg p-8 my-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              👋 Добро пожаловать в марафон!
            </h2>
            <div 
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: marathon.welcomeMessage }} 
            />
          </div>
        )}

        {/* Rules */}
        {marathon.rules && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              📋 Правила марафона
            </h2>
            <div 
              className="prose max-w-none text-gray-700 mb-8"
              dangerouslySetInnerHTML={{ __html: marathon.rules }} 
            />
            
            <div className="border-t pt-6">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="w-6 h-6 mt-1 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                  Я ознакомился и согласен с правилами марафона
                </span>
              </label>
            </div>

            <button
              disabled={!rulesAccepted}
              className={`mt-6 w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                rulesAccepted
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {rulesAccepted 
                ? '✓ Готов начать!' 
                : 'Примите правила для продолжения'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Остальная логика для не записанных пользователей или завершенного марафона...
  return (
    <div>
      {/* Обычная страница описания марафона */}
    </div>
  );
}
```

### 4. Копирование компонента CountdownTimer

Скопируйте файл `/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/docs/frontend/components/CountdownTimer.tsx` в:
```
/Users/alexeipinaev/Documents/Rejuvena/web/src/components/CountdownTimer.tsx
```

## Тестирование

1. Перезапустите backend (изменения уже на продакшене после push):
```bash
ssh root@37.252.20.170 "pm2 restart rejuvena-backend"
```

2. Тестируйте frontend локально:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
npm run dev
```

3. Проверьте:
   - ✅ История платежей показывает "Покупка: Название продукта"
   - ✅ Карточки оплаченных марафонов показывают бейдж "Оплачено"
   - ✅ Кнопка на оплаченном марафоне - "Перейти к марафону →"
   - ✅ Страница марафона до начала показывает таймер
   - ✅ Отображаются правила с чекбоксом согласия
   - ✅ После начала марафона происходит редирект на первый день

## Деплой

После успешного тестирования:
```bash
cd /Users/alexeipinaev/Documents/Rejuvena/web
git add -A
git commit -m "feat: improved payment history, marathon cards with paid status, and pre-start marathon page with countdown timer"
git push
```

GitHub Actions автоматически задеплоит на https://seplitza.github.io/rejuvena/
