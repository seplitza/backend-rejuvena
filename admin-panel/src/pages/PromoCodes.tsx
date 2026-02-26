import { useEffect, useState } from 'react';
import api from '../api/client';

interface PromoCode {
  _id: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  

usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    minOrderAmount: 0,
    maxDiscount: 0,
    usageLimit: 0,
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      const response = await api.get('/shop/promo-codes');
      setPromoCodes(response.data);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        minOrderAmount: formData.minOrderAmount || undefined,
        maxDiscount: formData.maxDiscount || undefined,
        usageLimit: formData.usageLimit || undefined,
        expiresAt: formData.expiresAt || undefined
      };

      if (editing) {
        await api.put(`/shop/promo-codes/${editing}`, data);
      } else {
        await api.post('/shop/promo-codes', data);
      }
      loadPromoCodes();
      resetForm();
    } catch (error) {
      console.error('Failed to save promo code:', error);
      alert('Ошибка при сохранении');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: 0,
      discountType: 'percentage',
      minOrderAmount: 0,
      maxDiscount: 0,
      usageLimit: 0,
      expiresAt: '',
      isActive: true
    });
    setEditing(null);
  };

  const handleEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discount: promo.discount,
      discountType: promo.discountType,
      minOrderAmount: promo.minOrderAmount || 0,
      maxDiscount: promo.maxDiscount || 0,
      usageLimit: promo.usageLimit || 0,
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : '',
      isActive: promo.isActive
    });
    setEditing(promo._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот промокод?')) return;

    try {
      await api.delete(`/shop/promo-codes/${id}`);
      setPromoCodes(promoCodes.filter(p => p._id !== id));
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      alert('Ошибка при удалении');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
        Промокоды
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Form */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            {editing ? 'Редактировать промокод' : 'Новый промокод'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Код *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                placeholder="SALE2026"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Тип скидки
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="percentage">Процент</option>
                <option value="fixed">Фиксированная сумма</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Скидка * {formData.discountType === 'percentage' ? '(%)' : '(₽)'}
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                required
                min="0"
                max={formData.discountType === 'percentage' ? 100 : undefined}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Минимальная сумма заказа (₽)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Максимальная скидка (₽)
              </label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Лимит использований
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                min="0"
                placeholder="0 = неограничено"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Срок действия
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Активен</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editing ? 'Сохранить' : 'Создать'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '12px 16px',
                    background: 'white',
                    color: '#6B7280',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Код
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Скидка
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Использовано
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Срок
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Статус
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map(promo => (
                <tr key={promo._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#1F2937', fontFamily: 'monospace', fontSize: '16px' }}>
                      {promo.code}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600', color: '#1F2937' }}>
                      {promo.discountType === 'percentage' ? `${promo.discount}%` : `${promo.discount}₽`}
                    </div>
                    {promo.minOrderAmount && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        От {promo.minOrderAmount}₽
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    {promo.usedCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : ''}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                    {promo.expiresAt ? formatDate(promo.expiresAt) : '∞'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: promo.isActive ? '#D1FAE5' : '#F3F4F6',
                      color: promo.isActive ? '#065F46' : '#6B7280'
                    }}>
                      {promo.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(promo)}
                        style={{
                          padding: '6px 12px',
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(promo._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {promoCodes.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              Нет промокодов
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
