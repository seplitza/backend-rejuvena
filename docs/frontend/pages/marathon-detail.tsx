/**
 * Marathon Detail Page - Single Marathon View with Enrollment
 * Shows marathon info, days list, and enrollment/payment options
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/store/hooks';
import { API_URL } from '@/config/api';
import PaymentModal from '@/components/PaymentModal';

interface Marathon {
  _id: string;
  title: string;
  startDate: string;
  numberOfDays: number;
  tenure: number;
  cost: number;
  isPaid: boolean;
  isPublic: boolean;
  hasContest: boolean;
  language: string;
  courseDescription?: string;
  welcomeMessage?: string;
  rules?: string;
  contestStartDate?: string;
  contestEndDate?: string;
  votingStartDate?: string;
  votingEndDate?: string;
}

interface MarathonDay {
  _id: string;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string;
  exercises: Array<{
    _id: string;
    title: string;
  }>;
  isAvailable?: boolean;
}

interface Enrollment {
  _id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  currentDay: number;
  completedDays: number[];
  enrolledAt: string;
  isPaid: boolean;
}

export default function MarathonDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [marathon, setMarathon] = useState<Marathon | null>(null);
  const [days, setDays] = useState<MarathonDay[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'days' | 'rules'>('info');

  useEffect(() => {
    if (id) {
      loadMarathon();
      loadDays();
      if (isAuthenticated) {
        loadEnrollment();
      }
    }
  }, [id, isAuthenticated]);

  const loadMarathon = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marathons/${id}`);
      if (!response.ok) throw new Error('Failed to load marathon');
      const data = await response.json();
      setMarathon(data);
    } catch (err) {
      console.error('Error loading marathon:', err);
      setError('Не удалось загрузить марафон');
    } finally {
      setLoading(false);
    }
  };

  const loadDays = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marathons/${id}/days`);
      if (!response.ok) throw new Error('Failed to load days');
      const data = await response.json();
      setDays(data.days || []);
    } catch (err) {
      console.error('Error loading days:', err);
    }
  };

  const loadEnrollment = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/marathons/${id}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnrollment(data.enrollment);
      }
    } catch (err) {
      console.error('Error loading enrollment:', err);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }

    if (marathon?.isPaid && !enrollment?.isPaid) {
      setPaymentModalOpen(true);
      return;
    }

    try {
      setEnrolling(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/marathons/${id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Не удалось записаться');
      }

      await loadEnrollment();
      alert('✅ Вы успешно записались на марафон!');
    } catch (err) {
      console.error('Error enrolling:', err);
      alert(err instanceof Error ? err.message : 'Ошибка при записи');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDayClick = (day: MarathonDay) => {
    if (!enrollment) {
      alert('Сначала запишитесь на марафон');
      return;
    }
    
    if (!day.isAvailable) {
      alert('Этот день ещё не доступен. Он откроется по расписанию.');
      return;
    }

    router.push(`/marathons/${id}/day/${day.dayNumber}`);
  };

  const getMarathonStatus = () => {
    if (!marathon) return { text: '', color: '', daysRemaining: 0 };
    
    const now = new Date();
    const start = new Date(marathon.startDate);
    const end = new Date(start.getTime() + marathon.tenure * 24 * 60 * 60 * 1000);
    
    if (now < start) {
      const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Начнётся через ${days} ${getDaysWord(days)}`, color: '#F59E0B', daysRemaining: days };
    }
    if (now > end) {
      return { text: 'Завершён', color: '#6B7280', daysRemaining: 0 };
    }
    
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `День ${daysPassed + 1}`, color: '#10B981', daysRemaining: marathon.tenure - daysPassed - 1 };
  };

  const getDaysWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
    return 'дней';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6B7280' }}>Загрузка...</div>
      </div>
    );
  }

  if (error || !marathon) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#DC2626', marginBottom: '16px' }}>
          ❌ {error || 'Марафон не найден'}
        </div>
        <button
          onClick={() => router.push('/marathons')}
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const status = getMarathonStatus();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        color: 'white',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: status.color,
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {status.text}
        </div>

        <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '16px', paddingRight: '150px' }}>
          {marathon.title}
        </h1>

        <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', fontSize: '16px', opacity: 0.95 }}>
          <div>📅 Старт: {formatDate(marathon.startDate)}</div>
          <div>⏱️ Продолжительность: {marathon.tenure} {getDaysWord(marathon.tenure)}</div>
          <div>💪 Упражнений: {marathon.numberOfDays}</div>
        </div>

        {/* Enrollment Status */}
        {enrollment && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Ваш прогресс</div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {enrollment.completedDays.length}/{marathon.numberOfDays}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>дней завершено</div>
              </div>
              <div style={{
                flex: 1,
                height: '8px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(enrollment.completedDays.length / marathon.numberOfDays) * 100}%`,
                  background: 'white',
                  borderRadius: '4px',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        {!enrollment ? (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: enrolling ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              opacity: enrolling ? 0.7 : 1
            }}
          >
            {enrolling ? 'Записываем...' : marathon.isPaid ? `Записаться за ${marathon.cost}₽` : 'Записаться бесплатно'}
          </button>
        ) : enrollment.status === 'pending' ? (
          <div style={{
            padding: '14px 32px',
            background: 'rgba(251, 191, 36, 0.2)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            ⏳ Ожидание оплаты
          </div>
        ) : (
          <div style={{
            padding: '14px 32px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            ✓ Вы участвуете в марафоне
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #E5E7EB', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'info', label: '📖 Описание' },
            { id: 'days', label: '📅 Программа' },
            { id: 'rules', label: '📋 Правила' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
                color: activeTab === tab.id ? '#4F46E5' : '#6B7280',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
                fontSize: '16px',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {activeTab === 'info' && (
          <div>
            {marathon.welcomeMessage && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>Добро пожаловать!</h2>
                <div
                  style={{ fontSize: '16px', lineHeight: '1.7', color: '#374151' }}
                  dangerouslySetInnerHTML={{ __html: marathon.welcomeMessage }}
                />
              </div>
            )}
            
            {marathon.courseDescription && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>О марафоне</h2>
                <div
                  style={{ fontSize: '16px', lineHeight: '1.7', color: '#374151' }}
                  dangerouslySetInnerHTML={{ __html: marathon.courseDescription }}
                />
              </div>
            )}

            {marathon.hasContest && (
              <div style={{
                marginTop: '32px',
                padding: '24px',
                background: '#FEF3C7',
                borderRadius: '12px',
                border: '1px solid #FDE68A'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#92400E', marginBottom: '12px' }}>
                  🏆 В этом марафоне проводится конкурс!
                </h3>
                <div style={{ fontSize: '15px', color: '#78350F', lineHeight: '1.6' }}>
                  {marathon.contestStartDate && (
                    <div>Конкурс: {formatDate(marathon.contestStartDate)} - {marathon.contestEndDate && formatDate(marathon.contestEndDate)}</div>
                  )}
                  {marathon.votingStartDate && (
                    <div>Голосование: {formatDate(marathon.votingStartDate)} - {marathon.votingEndDate && formatDate(marathon.votingEndDate)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'days' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Программа марафона</h2>
            
            {days.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                Программа скоро появится
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {days.map((day) => (
                  <div
                    key={day._id}
                    onClick={() => handleDayClick(day)}
                    style={{
                      padding: '20px',
                      border: day.isAvailable ? '2px solid #10B981' : '1px solid #E5E7EB',
                      borderRadius: '12px',
                      cursor: day.isAvailable ? 'pointer' : 'not-allowed',
                      background: day.isAvailable ? '#F0FDF4' : '#F9FAFB',
                      opacity: day.isAvailable ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (day.isAvailable) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                          День {day.dayNumber}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>
                          {day.dayType === 'learning' ? '📚 Обучение' : '🏋️ Практика'} • {day.exercises.length} упражнений
                        </div>
                      </div>
                      
                      {enrollment?.completedDays.includes(day.dayNumber) && (
                        <div style={{
                          padding: '4px 12px',
                          background: '#10B981',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ✓ Завершён
                        </div>
                      )}
                      
                      {!day.isAvailable && (
                        <div style={{
                          padding: '4px 12px',
                          background: '#6B7280',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          🔒 Заблокирован
                        </div>
                      )}
                    </div>

                    {day.description && (
                      <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                        {day.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>Правила марафона</h2>
            {marathon.rules ? (
              <div
                style={{ fontSize: '16px', lineHeight: '1.7', color: '#374151' }}
                dangerouslySetInnerHTML={{ __html: marathon.rules }}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                Правила будут добавлены позже
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && marathon.isPaid && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          productType="marathon"
          productId={marathon._id}
          productName={marathon.title}
          price={marathon.cost}
          onPaymentSuccess={() => {
            setPaymentModalOpen(false);
            loadEnrollment();
          }}
        />
      )}
    </div>
  );
}
