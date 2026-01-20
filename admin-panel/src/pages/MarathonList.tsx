import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

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
  updatedAt: string;
  enrollmentCount?: number;
}

export default function MarathonList() {
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'public' | 'display'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMarathons();
  }, []);

  const loadMarathons = async () => {
    try {
      const response = await api.get('/marathons/admin/all');
      setMarathons(response.data.marathons || []);
    } catch (error) {
      console.error('Failed to load marathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить марафон "${title}"?\n\nЭто также удалит все дни и записи пользователей!`)) return;

    try {
      await api.delete(`/marathons/admin/${id}`);
      setMarathons(marathons.filter(m => m._id !== id));
      alert('Марафон удалён');
    } catch (error) {
      console.error('Failed to delete marathon:', error);
      alert('Ошибка при удалении');
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    if (!confirm(`Создать копию марафона "${title}"?`)) return;

    try {
      const response = await api.post(`/marathons/admin/${id}/duplicate`);
      await loadMarathons();
      alert(`Копия создана: ${response.data.title}`);
    } catch (error) {
      console.error('Failed to duplicate marathon:', error);
      alert('Ошибка при копировании');
    }
  };

  const filteredMarathons = marathons.filter(m => {
    // Фильтр по видимости
    if (filter === 'public' && !m.isPublic) return false;
    if (filter === 'display' && !m.isDisplay) return false;
    
    // Поиск по названию или ID
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = m.title.toLowerCase().includes(query);
      const matchesId = m._id.toLowerCase().includes(query);
      if (!matchesTitle && !matchesId) return false;
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getMarathonStatus = (startDate: string, tenure: number) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(start.getTime() + tenure * 24 * 60 * 60 * 1000);
    
    if (now < start) return { text: 'Скоро', color: '#F59E0B' };
    if (now > end) return { text: 'Завершён', color: '#6B7280' };
    return { text: 'Активен', color: '#10B981' };
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Марафоны</h1>
        <Link
          to="/marathons/new"
          style={{
            padding: '12px 24px',
            background: '#4F46E5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            display: 'inline-block'
          }}
        >
          + Создать марафон
        </Link>
      </div>

      {/* Фильтры и поиск */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Статус фильтр */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: filter === 'all' ? '#4F46E5' : 'white',
              color: filter === 'all' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Все ({marathons.length})
          </button>
          <button
            onClick={() => setFilter('public')}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: filter === 'public' ? '#4F46E5' : 'white',
              color: filter === 'public' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Публичные ({marathons.filter(m => m.isPublic).length})
          </button>
          <button
            onClick={() => setFilter('display')}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: filter === 'display' ? '#4F46E5' : 'white',
              color: filter === 'display' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            На витрине ({marathons.filter(m => m.isDisplay).length})
          </button>
        </div>

        {/* Поиск */}
        <input
          type="text"
          placeholder="Поиск по названию или ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 16px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Таблица марафонов */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F9FAFB' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Название</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Старт</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Статус</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Дней</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Цена</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Участников</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Флаги</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarathons.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  {searchQuery ? 'Марафоны не найдены' : 'Нет марафонов. Создайте первый!'}
                </td>
              </tr>
            ) : (
              filteredMarathons.map((marathon) => {
                const status = getMarathonStatus(marathon.startDate, marathon.tenure);
                
                return (
                  <tr key={marathon._id} style={{ borderTop: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{marathon.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        {marathon.language === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: '14px' }}>
                      {formatDate(marathon.startDate)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: `${status.color}15`,
                        color: status.color
                      }}>
                        {status.text}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: '14px' }}>
                      {marathon.numberOfDays} / {marathon.tenure}д
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: '14px' }}>
                      {marathon.isPaid ? `${marathon.cost}₽` : 'Бесплатно'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: '14px' }}>
                      {marathon.enrollmentCount || 0}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
                        {marathon.isPublic && (
                          <span style={{ padding: '2px 6px', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px' }}>
                            👁️ Public
                          </span>
                        )}
                        {marathon.isDisplay && (
                          <span style={{ padding: '2px 6px', background: '#D1FAE5', color: '#065F46', borderRadius: '4px' }}>
                            🏪 Display
                          </span>
                        )}
                        {marathon.hasContest && (
                          <span style={{ padding: '2px 6px', background: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
                            🏆 Contest
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/marathons/${marathon._id}`}
                          style={{
                            padding: '6px 12px',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          Редактировать
                        </Link>
                        <button
                          onClick={() => handleDuplicate(marathon._id, marathon.title)}
                          style={{
                            padding: '6px 12px',
                            background: '#F3F4F6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Копировать
                        </button>
                        <button
                          onClick={() => handleDelete(marathon._id, marathon.title)}
                          style={{
                            padding: '6px 12px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
