import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  tags: any[];
  updatedAt: string;
}

interface Tag {
  _id: string;
  name: string;
  color: string;
}

export default function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');

  useEffect(() => {
    loadExercises();
    loadTags();
  }, []);

  const loadExercises = async () => {
    try {
      const response = await api.get('/exercises');
      setExercises(response.data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await api.get('/tags');
      setAllTags(response.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это упражнение?')) return;

    try {
      await api.delete(`/exercises/${id}`);
      setExercises(exercises.filter(e => e._id !== id));
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      alert('Ошибка при удалении');
    }
  };

  const filteredExercises = exercises.filter(e => {
    // Фильтр по статусу публикации
    if (filter === 'published' && !e.isPublished) return false;
    if (filter === 'draft' && e.isPublished) return false;
    
    // Поиск по названию или ID
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = e.title.toLowerCase().includes(query);
      const matchesId = e._id.toLowerCase().includes(query);
      if (!matchesTitle && !matchesId) return false;
    }
    
    // Фильтр по тегу
    if (selectedTagId) {
      const hasTag = e.tags.some((tag: any) => tag._id === selectedTagId);
      if (!hasTag) return false;
    }
    
    return true;
  });

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Упражнения</h1>
        <Link
          to="/exercises/new"
          style={{
            padding: '12px 24px',
            background: '#4F46E5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          + Создать упражнение
        </Link>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {(['all', 'published', 'draft'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              border: filter === f ? 'none' : '1px solid #D1D5DB',
              background: filter === f ? '#4F46E5' : 'white',
              color: filter === f ? 'white' : '#374151',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {f === 'all' ? 'Все' : f === 'published' ? 'Опубликованные' : 'Черновики'}
          </button>
        ))}
      </div>

      {/* Search and Tag Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию или ID..."
          style={{
            flex: '1 1 300px',
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        
        <select
          value={selectedTagId}
          onChange={(e) => setSelectedTagId(e.target.value)}
          style={{
            flex: '0 1 200px',
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            background: 'white'
          }}
        >
          <option value="">Все теги</option>
          {allTags.map(tag => (
            <option key={tag._id} value={tag._id}>
              {tag.name}
            </option>
          ))}
        </select>

        {(searchQuery || selectedTagId) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTagId('');
            }}
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              background: 'white',
              color: '#6B7280',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '16px', color: '#6B7280', fontSize: '14px' }}>
        Найдено упражнений: {filteredExercises.length} из {exercises.length}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredExercises.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: 'white',
            borderRadius: '12px',
            color: '#6B7280'
          }}>
            Упражнений не найдено
          </div>
        ) : (
          filteredExercises.map(exercise => (
            <div
              key={exercise._id}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{exercise.title}</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: exercise.isPublished ? '#D1FAE5' : '#FEE2E2',
                    color: exercise.isPublished ? '#065F46' : '#991B1B'
                  }}>
                    {exercise.isPublished ? 'Опубликовано' : 'Черновик'}
                  </span>
                </div>
                <p style={{ color: '#6B7280', marginBottom: '12px' }}>
                  {exercise.description.substring(0, 150)}
                  {exercise.description.length > 150 && '...'}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {exercise.tags.map((tag: any) => (
                    <span
                      key={tag._id}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: tag.color + '20',
                        color: tag.color
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <Link
                  to={`/exercises/${exercise._id}`}
                  style={{
                    padding: '8px 16px',
                    background: '#4F46E5',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => handleDelete(exercise._id)}
                  style={{
                    padding: '8px 16px',
                    background: '#DC2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
