import { useEffect, useState } from 'react';
import api from '../api/client';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  discount: number;
  shippingCost: number;
  finalTotal: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
  };
  createdAt: string;
}

export default function ShopOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.get('/shop/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/shop/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus as any } : o));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const filteredOrders = orders.filter(o => {
    // Фильтр по статусу
    if (filter !== 'all' && o.status !== filter) return false;
    
    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesNumber = o.orderNumber.toLowerCase().includes(query);
      const matchesEmail = o.user.email.toLowerCase().includes(query);
      const matchesName = `${o.user.firstName || ''} ${o.user.lastName || ''}`.toLowerCase().includes(query);
      if (!matchesNumber && !matchesEmail && !matchesName) return false;
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#FEF3C7', color: '#92400E', label: 'Ожидает' },
      processing: { bg: '#DBEAFE', color: '#1E40AF', label: 'Обрабатывается' },
      shipped: { bg: '#E0E7FF', color: '#4338CA', label: 'Отправлен' },
      delivered: { bg: '#D1FAE5', color: '#065F46', label: 'Доставлен' },
      cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'Отменен' }
    };
    
    const style = styles[status] || styles.pending;
    
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#FEF3C7', color: '#92400E', label: 'Ожидает оплаты' },
      paid: { bg: '#D1FAE5', color: '#065F46', label: 'Оплачен' },
      failed: { bg: '#FEE2E2', color: '#991B1B', label: 'Ошибка' },
      refunded: { bg: '#F3F4F6', color: '#6B7280', label: 'Возврат' }
    };
    
    const style = styles[status] || styles.pending;
    
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
        Заказы магазина
      </h1>

      {/* Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map(f => (
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
            {f === 'all' ? 'Все' :
             f === 'pending' ? 'Ожидают' :
             f === 'processing' ? 'В обработке' :
             f === 'shipped' ? 'Отправлены' : 'Доставлены'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по номеру, email или имени..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
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
        Найдено заказов: {filteredOrders.length} из {orders.length}
      </div>

      {/* Orders List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredOrders.map(order => (
          <div
            key={order._id}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937', marginBottom: '4px' }}>
                  Заказ #{order.orderNumber}
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '8px' }}>
                  {getStatusBadge(order.status)}
                </div>
                <div>
                  {getPaymentBadge(order.paymentStatus)}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                {order.user.firstName || order.user.lastName ? 
                  `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 
                  'Клиент'}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                {order.user.email}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                <div>{order.shippingAddress.fullName}</div>
                <div>{order.shippingAddress.phone}</div>
                <div>{order.shippingAddress.city}, {order.shippingAddress.address}</div>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>
                Товары:
              </div>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: idx < order.items.length - 1 ? '1px solid #E5E7EB' : 'none'
                  }}
                >
                  <span style={{ color: '#374151' }}>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: '600', color: '#1F2937' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span style={{ color: '#6B7280' }}>Сумма товаров:</span>
                <span style={{ color: '#374151' }}>{formatPrice(order.total)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                  <span style={{ color: '#6B7280' }}>Скидка:</span>
                  <span style={{ color: '#DC2626' }}>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                <span style={{ color: '#6B7280' }}>Доставка:</span>
                <span style={{ color: '#374151' }}>
                  {order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Бесплатно'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>Итого:</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#4F46E5' }}>
                  {formatPrice(order.finalTotal)}
                </span>
              </div>
            </div>

            {/* Status Change */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
                Изменить статус:
              </span>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="pending">Ожидает</option>
                <option value="processing">Обрабатывается</option>
                <option value="shipped">Отправлен</option>
                <option value="delivered">Доставлен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            {searchQuery ? 'Заказы не найдены' : 'Нет заказов'}
          </div>
        )}
      </div>
    </div>
  );
}
