import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalExercises: 0,
    publishedExercises: 0,
    totalTags: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [exercisesRes, tagsRes] = await Promise.all([
        api.get('/exercises'),
        api.get('/tags')
      ]);

      const exercises = exercisesRes.data;
      setStats({
        totalExercises: exercises.length,
        publishedExercises: exercises.filter((e: any) => e.isPublished).length,
        totalTags: tagsRes.data.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
        Dashboard
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Всего упражнений
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1F2937' }}>
            {stats.totalExercises}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Опубликовано
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10B981' }}>
            {stats.publishedExercises}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Всего тегов
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4F46E5' }}>
            {stats.totalTags}
          </div>
        </div>
      </div>
    </div>
  );
}
