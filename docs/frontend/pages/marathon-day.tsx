/**
 * Marathon Day Page - Individual Day View
 * Shows exercises for specific marathon day
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/store/hooks';
import { API_URL } from '@/config/api';
import ExerciseItem from '@/components/day/ExerciseItem';
import ExerciseDetailModal from '@/components/day/ExerciseDetailModal';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  content: string;
  duration?: string;
  carouselMedia: Array<{
    type: string;
    url: string;
    filename: string;
    order: number;
  }>;
  tags: Array<{
    _id: string;
    name: string;
    slug: string;
    color: string;
  }>;
}

interface MarathonDay {
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string;
  exercises: Exercise[];
}

export default function MarathonDayPage() {
  const router = useRouter();
  const { id, dayNumber } = router.query;
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [dayData, setDayData] = useState<MarathonDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (id && dayNumber) {
      loadDay();
    }
  }, [id, dayNumber]);

  const loadDay = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/marathons/${id}/day/${dayNumber}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не удалось загрузить день');
      }

      const data = await response.json();
      setDayData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading day:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки дня');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!isAuthenticated) {
      alert('Войдите для отметки прогресса');
      return;
    }

    try {
      setCompleting(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/api/marathons/${id}/complete-day`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dayNumber: Number(dayNumber) })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Не удалось отметить день');
      }

      alert('✅ День завершён! Отличная работа!');
      router.push(`/marathons/${id}`);
    } catch (err) {
      console.error('Error completing day:', err);
      alert(err instanceof Error ? err.message : 'Ошибка при завершении дня');
    } finally {
      setCompleting(false);
    }
  };

  const toggleExerciseComplete = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    setCompletedExercises(newCompleted);
  };

  const allExercisesCompleted = dayData?.exercises.every(ex => completedExercises.has(ex._id)) || false;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6B7280' }}>Загрузка дня...</div>
      </div>
    );
  }

  if (error || !dayData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#DC2626', marginBottom: '16px' }}>
          ❌ {error || 'День не найден'}
        </div>
        <button
          onClick={() => router.push(`/marathons/${id}`)}
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
          Вернуться к марафону
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Navigation */}
      <button
        onClick={() => router.push(`/marathons/${id}`)}
        style={{
          padding: '8px 16px',
          background: '#F3F4F6',
          color: '#374151',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        ← Вернуться к марафону
      </button>

      {/* Day Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        color: 'white',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px' }}>
              День {dayData.dayNumber}
            </h1>
            <div style={{ fontSize: '18px', opacity: 0.95, marginBottom: '16px' }}>
              {dayData.dayType === 'learning' ? '📚 Обучающий день' : '🏋️ День практики'}
            </div>
            {dayData.description && (
              <p style={{ fontSize: '16px', opacity: 0.9, margin: 0, maxWidth: '600px' }}>
                {dayData.description}
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '16px 24px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
              {completedExercises.size}/{dayData.exercises.length}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>упражнений выполнено</div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>
          Упражнения дня
        </h2>

        {dayData.exercises.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            background: '#F9FAFB',
            borderRadius: '12px',
            color: '#6B7280'
          }}>
            В этом дне пока нет упражнений
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {dayData.exercises.map((exercise, index) => (
              <div
                key={exercise._id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: completedExercises.has(exercise._id) ? '2px solid #10B981' : '1px solid #E5E7EB',
                  position: 'relative'
                }}
              >
                {/* Completion Checkbox */}
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={completedExercises.has(exercise._id)}
                      onChange={() => toggleExerciseComplete(exercise._id)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#10B981'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                      Выполнено
                    </span>
                  </label>
                </div>

                {/* Exercise Number */}
                <div style={{
                  display: 'inline-block',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Упражнение {index + 1}
                </div>

                {/* Exercise Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px',
                  paddingRight: '120px'
                }}>
                  {exercise.title}
                </h3>

                {/* Exercise Description */}
                {exercise.description && (
                  <p style={{
                    fontSize: '15px',
                    color: '#6B7280',
                    lineHeight: '1.6',
                    marginBottom: '16px'
                  }}>
                    {exercise.description.substring(0, 200)}
                    {exercise.description.length > 200 && '...'}
                  </p>
                )}

                {/* Tags */}
                {exercise.tags && exercise.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {exercise.tags.map(tag => (
                      <span
                        key={tag._id}
                        style={{
                          padding: '4px 10px',
                          background: tag.color || '#EEF2FF',
                          color: '#4F46E5',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => setSelectedExercise(exercise)}
                  style={{
                    padding: '10px 20px',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  Открыть упражнение →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Day Button */}
      {dayData.exercises.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: '20px',
          padding: '24px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              {allExercisesCompleted ? '✅ Все упражнения выполнены!' : '📝 Отметьте все упражнения как выполненные'}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Прогресс: {completedExercises.size} из {dayData.exercises.length}
            </div>
          </div>

          <button
            onClick={handleCompleteDay}
            disabled={!allExercisesCompleted || completing}
            style={{
              padding: '12px 32px',
              background: allExercisesCompleted && !completing ? '#10B981' : '#D1D5DB',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: allExercisesCompleted && !completing ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: allExercisesCompleted ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          >
            {completing ? 'Сохранение...' : 'Завершить день'}
          </button>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={{
            id: selectedExercise._id,
            exerciseName: selectedExercise.title,
            marathonExerciseName: selectedExercise.duration || '',
            exerciseDescription: selectedExercise.content || selectedExercise.description,
            blockExercise: false,
            order: 0,
            exerciseContents: selectedExercise.carouselMedia.map((media) => ({
              id: media.url,
              type: media.type,
              contentPath: media.url,
              order: media.order,
              isActive: true,
              videoServer: ''
            }))
          }}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}
