/**
 * Marathons List Page - Browse All Available Marathons
 * Shows upcoming and active marathons with enrollment status
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/store/hooks';
import { API_URL } from '@/config/api';

interface Marathon {
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
  courseDescription?: string;
  welcomeMessage?: string;
  enrollmentCount?: number;
  userEnrolled?: boolean;
  userEnrollmentStatus?: 'pending' | 'active' | 'completed' | 'cancelled';
}

export default function MarathonsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarathons();
  }, []);

  const loadMarathons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marathons`);
      
      if (!response.ok) {
        throw new Error(`Failed to load marathons: ${response.statusText}`);
      }
      
      const data: Marathon[] = await response.json();
      setMarathons(data);
      setError(null);
    } catch (err) {
      console.error('Error loading marathons:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить марафоны');
    } finally {
      setLoading(false);
    }
  };

  const getMarathonStatus = (startDate: string, tenure: number) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(start.getTime() + tenure * 24 * 60 * 60 * 1000);
    
    if (now < start) {
      const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Начнётся через ${daysUntil} ${getDaysWord(daysUntil)}`, color: '#F59E0B', status: 'upcoming' };
    }
    if (now > end) {
      return { text: 'Завершён', color: '#6B7280', status: 'finished' };
    }
    
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `День ${daysPassed + 1} из ${tenure}`, color: '#10B981', status: 'active' };
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

  const handleMarathonClick = (marathonId: string) => {
    router.push(`/marathons/${marathonId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6B7280' }}>Загрузка марафонов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#DC2626', marginBottom: '16px' }}>❌ {error}</div>
        <button
          onClick={loadMarathons}
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
          Попробовать снова
        </button>
      </div>
    );
  }

  const displayMarathons = marathons.filter(m => m.isDisplay);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
          🏃 Марафоны Омоложения
        </h1>
        <p style={{ fontSize: '18px', color: '#6B7280', lineHeight: '1.6' }}>
          Присоединяйтесь к марафонам с фиксированной датой старта. Все участники проходят программу синхронно!
        </p>
      </div>

      {/* Marathons Grid */}
      {displayMarathons.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#F9FAFB', borderRadius: '16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Марафоны скоро появятся
          </div>
          <div style={{ fontSize: '16px', color: '#6B7280' }}>
            Мы готовим для вас интересные программы. Следите за обновлениями!
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {displayMarathons.map((marathon) => {
            const status = getMarathonStatus(marathon.startDate, marathon.tenure);
            
            return (
              <div
                key={marathon._id}
                onClick={() => handleMarathonClick(marathon._id)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: marathon.userEnrolled ? '2px solid #10B981' : '1px solid #E5E7EB'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Header with Status */}
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: status.color,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {status.text}
                  </div>
                  
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', paddingRight: '100px' }}>
                    {marathon.title}
                  </h3>
                  
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    📅 Старт: {formatDate(marathon.startDate)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                        Продолжительность
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {marathon.tenure} {getDaysWord(marathon.tenure)}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                        Упражнений
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {marathon.numberOfDays}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {marathon.hasContest && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        🏆 Конкурс
                      </span>
                    )}
                    
                    <span style={{
                      padding: '4px 10px',
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {marathon.language === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
                    </span>

                    {marathon.userEnrolled && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#D1FAE5',
                        color: '#065F46',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        ✓ Вы участвуете
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{
                    padding: '12px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>
                      {marathon.isPaid ? 'Стоимость' : 'Доступ'}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: marathon.isPaid ? '#4F46E5' : '#10B981' }}>
                      {marathon.isPaid ? `${marathon.cost} ₽` : 'Бесплатно'}
                    </div>
                  </div>

                  {/* Participants Count */}
                  {marathon.enrollmentCount !== undefined && marathon.enrollmentCount > 0 && (
                    <div style={{ marginTop: '12px', fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>
                      👥 {marathon.enrollmentCount} {marathon.enrollmentCount === 1 ? 'участник' : 'участников'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      {displayMarathons.length > 0 && (
        <div style={{
          marginTop: '60px',
          padding: '24px',
          background: '#EEF2FF',
          borderRadius: '12px',
          border: '1px solid #C7D2FE'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4F46E5', marginBottom: '12px' }}>
            💡 Как это работает?
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: '1.8' }}>
            <li>Все участники марафона начинают в одну дату</li>
            <li>Новые дни открываются автоматически по расписанию</li>
            <li>Синхронное прохождение создаёт эффект группы поддержки</li>
            <li>Конкурсы и голосования проходят одновременно для всех</li>
          </ul>
        </div>
      )}
    </div>
  );
}
