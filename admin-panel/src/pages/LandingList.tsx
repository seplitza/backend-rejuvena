import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Landing {
  _id: string;
  slug: string;
  title: string;
  metaDescription: string;
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  conversions: number;
  createdBy: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const LandingList: React.FC = () => {
  const navigate = useNavigate();
  const [landings, setLandings] = useState<Landing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLandings();
  }, [page, filterPublished, searchTerm]);

  const fetchLandings = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      
      if (searchTerm) params.search = searchTerm;
      if (filterPublished !== 'all') {
        params.published = filterPublished === 'published';
      }

      const response = await api.get('/landings', { params });
      
      if (response.data.success) {
        setLandings(response.data.landings);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching landings:', error);
      alert('Ошибка загрузки лендингов');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/landings/${id}/publish`, {
        isPublished: !currentStatus
      });

      if (response.data.success) {
        fetchLandings();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Ошибка изменения статуса публикации');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Удалить лендинг "${title}"?`)) return;

    try {
      const response = await api.delete(`/landings/${id}`);

      if (response.data.success) {
        fetchLandings();
      }
    } catch (error) {
      console.error('Error deleting landing:', error);
      alert('Ошибка удаления лендинга');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Лендинги</h1>
            <p className="text-gray-600 mt-1">Управление промо-страницами</p>
          </div>
          <button
            onClick={() => navigate('/landings/new')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            + Создать лендинг
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <input
              type="text"
              placeholder="Поиск по названию или slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            {/* Status Filter */}
            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Все статусы</option>
              <option value="published">Опубликованные</option>
              <option value="draft">Черновики</option>
            </select>
          </div>
        </div>

        {/* Landings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
            <p className="mt-4 text-gray-600">Загрузка...</p>
          </div>
        ) : landings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Нет лендингов
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый промо-лендинг для марафонов
            </p>
            <button
              onClick={() => navigate('/landings/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Создать лендинг
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {landings.map((landing) => (
              <div
                key={landing._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {landing.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          landing.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {landing.isPublished ? '✓ Опубликован' : '○ Черновик'}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{landing.metaDescription}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        🔗 <code className="bg-gray-100 px-2 py-1 rounded">{landing.slug}</code>
                      </span>
                      <span>👁️ {landing.views} просмотров</span>
                      <span>💰 {landing.conversions} конверсий</span>
                      <span>
                        📅 Создан: {formatDate(landing.createdAt)}
                      </span>
                      {landing.publishedAt && (
                        <span>
                          🚀 Опубликован: {formatDate(landing.publishedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/landings/${landing._id}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      title="Редактировать"
                    >
                      ✏️ Редактировать
                    </button>

                    <button
                      onClick={() => handleTogglePublish(landing._id, landing.isPublished)}
                      className={`px-4 py-2 rounded-lg transition ${
                        landing.isPublished
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      title={landing.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                    >
                      {landing.isPublished ? '⏸️' : '▶️'}
                    </button>

                    {landing.isPublished && (
                      <button
                        onClick={() => window.open(`https://seplitza.github.io/rejuvena/landing/${landing.slug}`, '_blank')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                        title="Открыть"
                      >
                        🔗
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(landing._id, landing.title)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Назад
            </button>
            <span className="px-4 py-2 bg-white rounded-lg border border-gray-300">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед →
            </button>
          </div>
        )}
      </div>
  );
};

export default LandingList;
