/**
 * Offer Management Page
 * Manage homepage promotional offers (Premium, Marathons, Exercises)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Offer {
  _id: string;
  type: 'premium' | 'marathon' | 'exercise';
  title: string;
  subtitle?: string;
  badge?: string;
  price?: number;
  priceLabel?: string;
  isVisible: boolean;
  order: number;
  showToLoggedIn: boolean;
  showToGuests: boolean;
  hiddenIfOwned: boolean;
  marathonId?: {
    _id: string;
    title: string;
    cost: number;
    isPaid: boolean;
  };
  exerciseId?: {
    _id: string;
    title: string;
    isPremium: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OfferManagement() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const response = await api.get('/offers/admin/all');
      setOffers(response.data.offers || []);
    } catch (error) {
      console.error('Failed to load offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      await api.post(`/offers/${id}/toggle-visibility`);
      await loadOffers();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      alert('Ошибка при изменении видимости');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить предложение "${title}"?`)) return;

    try {
      await api.delete(`/offers/${id}`);
      setOffers(offers.filter(o => o._id !== id));
      alert('Предложение удалено');
    } catch (error) {
      console.error('Failed to delete offer:', error);
      alert('Ошибка при удалении');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'premium': return '⭐ Premium';
      case 'marathon': return '🏃 Марафон';
      case 'exercise': return '💪 Упражнение';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return '#9333EA';
      case 'marathon': return '#3B82F6';
      case 'exercise': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            Предложения
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Управление карточками на главной странице
          </p>
        </div>
        <button
          onClick={() => navigate('/offers/new')}
          style={{
            padding: '12px 24px',
            background: '#4F46E5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-block'
          }}
        >
          + Создать предложение
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Всего</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{offers.length}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Видимые</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981' }}>
            {offers.filter(o => o.isVisible).length}
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Скрытые</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6B7280' }}>
            {offers.filter(o => !o.isVisible).length}
          </div>
        </div>
      </div>

      {/* Offers Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {offers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>Нет предложений</p>
            <p style={{ fontSize: '14px' }}>Создайте первое предложение для главной страницы</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  #
                </th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  Тип
                </th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  Название
                </th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  Цена
                </th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  Видимость
                </th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  Показывать
                </th>
                <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer, index) => (
                <tr key={offer._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                    {offer.order || index + 1}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: `${getTypeColor(offer.type)}20`,
                      color: getTypeColor(offer.type)
                    }}>
                      {getTypeLabel(offer.type)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '2px' }}>
                      {offer.title}
                    </div>
                    {offer.subtitle && (
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        {offer.subtitle}
                      </div>
                    )}
                    {offer.badge && (
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        {offer.badge}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    {offer.price ? (
                      <>
                        <span style={{ fontWeight: '600' }}>{offer.price} ₽</span>
                        {offer.priceLabel && (
                          <span style={{ color: '#9CA3AF', fontSize: '12px', marginLeft: '4px' }}>
                            {offer.priceLabel}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => handleToggleVisibility(offer._id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        background: offer.isVisible ? '#10B98120' : '#6B728020',
                        color: offer.isVisible ? '#10B981' : '#6B7280'
                      }}
                    >
                      {offer.isVisible ? '👁️ Показано' : '🙈 Скрыто'}
                    </button>
                  </td>
                  <td style={{ padding: '16px', fontSize: '12px', color: '#6B7280' }}>
                    {offer.showToGuests && offer.showToLoggedIn ? (
                      'Всем'
                    ) : offer.showToGuests ? (
                      'Гостям'
                    ) : offer.showToLoggedIn ? (
                      'Авторизованным'
                    ) : (
                      'Никому'
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/offers/edit/${offer._id}`)}
                      style={{
                        padding: '8px 12px',
                        background: '#F3F4F6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '8px',
                        fontSize: '14px'
                      }}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(offer._id, offer.title)}
                      style={{
                        padding: '8px 12px',
                        background: '#FEE2E2',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <div style={{ marginTop: '24px', padding: '16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#1E40AF', fontWeight: '500', marginBottom: '8px' }}>
          💡 Как это работает
        </div>
        <ul style={{ fontSize: '13px', color: '#1E40AF', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
          <li>Предложения отображаются в карусели на главной странице приложения</li>
          <li>Порядок отображения определяется полем "Порядок" (меньше = выше)</li>
          <li>Premium скрывается автоматически если у пользователя уже есть подписка</li>
          <li>Марафоны скрываются если пользователь уже записан (при hiddenIfOwned = true)</li>
          <li>Используйте настройки видимости для A/B тестирования</li>
        </ul>
      </div>
    </div>
  );
}
