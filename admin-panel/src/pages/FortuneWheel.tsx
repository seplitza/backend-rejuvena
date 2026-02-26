import { useEffect, useState } from 'react';
import api from '../api/client';

interface Prize {
  _id: string;
  title: string;
  description?: string;
  type: 'discount' | 'product' | 'freeShipping';
  value: number;
  probability: number;
  color: string;
  isActive: boolean;
}

export default function FortuneWheel() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'discount' as 'discount' | 'product' | 'freeShipping',
    value: 0,
    probability: 0,
    color: '#ec4899',
    isActive: true
  });

  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const response = await api.get('/shop/fortune-wheel/prizes');
      setPrizes(response.data);
    } catch (error) {
      console.error('Failed to load prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        await api.put(`/shop/fortune-wheel/prizes/${editing}`, formData);
      } else {
        await api.post('/shop/fortune-wheel/prizes', formData);
      }
      loadPrizes();
      resetForm();
    } catch (error) {
      console.error('Failed to save prize:', error);
      alert('Ошибка при сохранении');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'discount',
      value: 0,
      probability: 0,
      color: '#ec4899',
      isActive: true
    });
    setEditing(null);
  };

  const handleEdit = (prize: Prize) => {
    setFormData({
      title: prize.title,
      description: prize.description || '',
      type: prize.type,
      value: prize.value,
      probability: prize.probability,
      color: prize.color,
      isActive: prize.isActive
    });
    setEditing(prize._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот приз?')) return;

    try {
      await api.delete(`/shop/fortune-wheel/prizes/${id}`);
      setPrizes(prizes.filter(p => p._id !== id));
    } catch (error) {
      console.error('Failed to delete prize:', error);
      alert'Ошибка при удалении');
    }
  };

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          Колесо Фортуны
        </h1>
        <p style={{ color: '#6B7280' }}>
          Управление призами. Общая вероятность: {totalProbability}% 
          {totalProbability !== 100 && (
            <span style={{ color: '#DC2626', marginLeft: '8px' }}>
              (должно быть 100%)
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Form */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            {editing ? 'Редактировать приз' : 'Новый приз'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Название *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Скидка 10%"
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
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="На следующий заказ"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Тип приза
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="discount">Скидка</option>
                <option value="product">Товар в подарок</option>
                <option value="freeShipping">Бесплатная доставка</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Значение * {formData.type === 'discount' ? '(%)' : ''}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
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
                Вероятность выпадения (%)
              </label>
              <input
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                required
                min="0"
                max="100"
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
                Цвет сектора
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: '64px',
                    height: '48px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
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
                  Приз
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Тип
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Вероятность
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
              {prizes.map(prize => (
                <tr key={prize._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: prize.color
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1F2937' }}>
                          {prize.title}
                        </div>
                        {prize.description && (
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {prize.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: '#F3F4F6',
                      color: '#374151'
                    }}>
                      {prize.type === 'discount' ? 'Скидка' : prize.type === 'product' ? 'Товар' : 'Доставка'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontWeight: '600' }}>
                    {prize.probability}%
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: prize.isActive ? '#D1FAE5' : '#F3F4F6',
                      color: prize.isActive ? '#065F46' : '#6B7280'
                    }}>
                      {prize.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(prize)}
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
                        onClick={() => handleDelete(prize._id)}
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

          {prizes.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              Нет призов
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
