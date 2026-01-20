import { useEffect, useState } from 'react';
import api from '../api/client';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
  premiumEndDate?: string;
  registeredAt: string;
}

interface Payment {
  id: string;
  orderNumber: string;
  amount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  description: string;
  metadata?: {
    planType?: string;
    duration?: number;
    type?: string;
    exerciseId?: string;
    exerciseName?: string;
  };
  createdAt: string;
  updatedAt: string;
  user: User | null;
  errorMessage?: string;
  errorCode?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидание',
  processing: 'Обработка',
  succeeded: 'Оплачен',
  failed: 'Ошибка',
  refunded: 'Возврат',
  cancelled: 'Отменен'
};

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  succeeded: '#10B981',
  failed: '#EF4444',
  refunded: '#8B5CF6',
  cancelled: '#6B7280'
};

export default function Orders() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [filter, page, searchQuery]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment/admin/all', {
        params: {
          page,
          limit: 50,
          status: filter,
          search: searchQuery || undefined
        }
      });
      setPayments(response.data.payments);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      await api.patch(`/payment/admin/${paymentId}/status`, { status: newStatus });
      await loadPayments();
      setEditingStatus(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActiveUntil = (payment: Payment) => {
    if (!payment.user) return null;
    
    if (payment.metadata?.planType === 'premium' && payment.user.premiumEndDate) {
      return formatDate(payment.user.premiumEndDate);
    }
    
    if (payment.metadata?.type === 'exercise') {
      // Упражнения активны 30 дней
      const activatedDate = new Date(payment.updatedAt);
      const expiryDate = new Date(activatedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      return formatDate(expiryDate.toISOString());
    }
    
    return null;
  };

  if (loading && payments.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6B7280' }}>Загрузка заказов...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          Заказы
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>
          Управление платежами и подписками
        </p>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск по email или номеру заказа..."
            style={{
              flex: '1 1 300px',
              padding: '10px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'succeeded', 'pending', 'processing', 'failed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: filter === status ? '#4F46E5' : '#F3F4F6',
                  color: filter === status ? 'white' : '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {status === 'all' ? 'Все' : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {payments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '16px' }}>Заказы не найдены</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Заказ</th>
                  <th style={thStyle}>Клиент</th>
                  <th style={thStyle}>Описание</th>
                  <th style={thStyle}>Сумма</th>
                  <th style={thStyle}>Статус</th>
                  <th style={thStyle}>Создан</th>
                  <th style={thStyle}>Активен до</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr 
                    key={payment.id}
                    style={{ 
                      borderBottom: '1px solid #E5E7EB',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Order Number */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '2px' }}>
                        {payment.orderNumber}
                      </div>
                      {payment.metadata?.type === 'exercise' && (
                        <div style={{ fontSize: '11px', color: '#8B5CF6' }}>
                          💪 Упражнение
                        </div>
                      )}
                      {payment.metadata?.planType === 'premium' && (
                        <div style={{ fontSize: '11px', color: '#F59E0B' }}>
                          ⭐ Премиум
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td style={tdStyle}>
                      {payment.user ? (
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '2px' }}>
                            {payment.user.firstName || payment.user.lastName 
                              ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim()
                              : 'Без имени'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {payment.user.email}
                          </div>
                          {payment.user.isPremium && (
                            <div style={{ 
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 8px',
                              background: '#FEF3C7',
                              color: '#92400E',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              PREMIUM
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Пользователь удален</span>
                      )}
                    </td>

                    {/* Description */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px', maxWidth: '250px' }}>
                        {payment.metadata?.exerciseName || payment.description}
                      </div>
                      {payment.errorMessage && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#DC2626',
                          marginTop: '4px',
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          ⚠️ {payment.errorMessage}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {payment.amount.toFixed(0)} ₽
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {payment.paymentMethod === 'card' ? 'Карта' : 
                         payment.paymentMethod === 'sbp' ? 'СБП' : 'Неизвестно'}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      {editingStatus === payment.id ? (
                        <select
                          value={payment.status}
                          onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                          onBlur={() => setEditingStatus(null)}
                          autoFocus
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        >
                          {Object.keys(statusLabels).map(status => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div 
                          onClick={() => setEditingStatus(payment.id)}
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: statusColors[payment.status] + '20',
                            color: statusColors[payment.status],
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {statusLabels[payment.status]}
                        </div>
                      )}
                    </td>

                    {/* Created Date */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px' }}>
                        {formatDate(payment.createdAt)}
                      </div>
                    </td>

                    {/* Active Until */}
                    <td style={tdStyle}>
                      {getActiveUntil(payment) ? (
                        <div style={{ fontSize: '13px', color: '#059669' }}>
                          {getActiveUntil(payment)}
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px' 
        }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              background: page === 1 ? '#F3F4F6' : 'white',
              color: page === 1 ? '#9CA3AF' : '#374151',
              borderRadius: '8px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Назад
          </button>
          
          <div style={{ 
            padding: '8px 16px', 
            border: '1px solid #D1D5DB',
            background: '#F9FAFB',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {page} / {totalPages}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              background: page === totalPages ? '#F3F4F6' : 'white',
              color: page === totalPages ? '#9CA3AF' : '#374151',
              borderRadius: '8px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: '14px',
  color: '#111827'
};
