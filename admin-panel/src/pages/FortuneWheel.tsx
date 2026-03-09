import { useEffect, useState } from 'react';
import api from '../api/client';

interface Prize {
  _id: string;
  name: string;
  description?: string;
  type: 'discount' | 'product' | 'freeShipping' | 'personalDiscount' | 'freeProduct' | 'noWin' | 'extraSpin';
  value: any;
  probability: number;
  icon?: string;
  validityDays?: number;
  isActive: boolean;
}

interface Winner {
  _id: string;
  user: {
    _id?: string;
    name: string;
    email?: string;
  };
  prize: {
    _id?: string;
    name: string;
    description?: string;
    type: string;
    value: any;
    icon?: string;
  };
  isUsed: boolean;
  usedAt?: string;
  expiryDate: string;
  wonAt: string;
}

export default function FortuneWheel() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedProbabilities, setEditedProbabilities] = useState<{[key: string]: number}>({});
  const [savingProbabilities, setSavingProbabilities] = useState(false);

  useEffect(() => {
    loadPrizes();
    loadWinners();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await api.get('/admin/fortune-wheel/settings');
      setIsEnabled(response.data.settings.isEnabled);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const toggleSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await api.put('/admin/fortune-wheel/settings', {
        isEnabled: !isEnabled
      });
      setIsEnabled(response.data.settings.isEnabled);
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Не удалось обновить настройки');
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadPrizes = async () => {
    try {
      const response = await api.get('/fortune-wheel/prizes');
      setPrizes(response.data);
    } catch (error) {
      console.error('Failed to load prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWinners = async () => {
    try {
      const response = await api.get('/admin/fortune-wheel/winners?limit=20');
      setWinners(response.data.winners);
    } catch (error) {
      console.error('Failed to load winners:', error);
    } finally {
      setLoadingWinners(false);
    }
  };

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
  
  const editedTotalProbability = editMode 
    ? Object.keys(editedProbabilities).reduce((sum, prizeId) => {
        const editedValue = editedProbabilities[prizeId];
        return sum + (editedValue !== undefined ? editedValue : prizes.find(p => p._id === prizeId)?.probability || 0);
      }, 0)
    : totalProbability;

  const startEditMode = () => {
    const initialProbabilities: {[key: string]: number} = {};
    prizes.forEach(prize => {
      initialProbabilities[prize._id] = prize.probability;
    });
    setEditedProbabilities(initialProbabilities);
    setEditMode(true);
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditedProbabilities({});
  };

  const saveProbabilities = async () => {
    // Валидация: сумма должна быть 100%
    const total = Object.values(editedProbabilities).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      alert(`Сумма вероятностей должна быть 100%. Текущая сумма: ${total.toFixed(1)}%`);
      return;
    }

    setSavingProbabilities(true);
    try {
      // Обновляем каждый приз
      const updates = Object.keys(editedProbabilities).map(prizeId => 
        api.put(`/admin/fortune-wheel/prizes/${prizeId}`, { 
          probability: editedProbabilities[prizeId] 
        })
      );
      
      await Promise.all(updates);
      
      alert('✅ Вероятности успешно обновлены!');
      setEditMode(false);
      setEditedProbabilities({});
      await loadPrizes(); // Перезагружаем призы
    } catch (error: any) {
      console.error('Failed to update probabilities:', error);
      alert('Ошибка при сохранении: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingProbabilities(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'discount': return 'Скидка';
      case 'product': return 'Товар';
      case 'freeProduct': return 'Подарок';
      case 'freeShipping': return 'Доставка';
      case 'extraSpin': return '🎰 Спин';
      case 'personalDiscount': return 'Персональная скидка';
      case 'noWin': return 'Без выигрыша';
      default: return type;
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Fortune Wheel Toggle */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '24px', 
        backgroundColor: '#F9FAFB', 
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              {isEnabled ? '🟢 Колесо Фортуны включено' : '🔴 Колесо Фортуны отключено'}
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
              {isEnabled 
                ? 'Пользователи могут крутить колесо и получать призы' 
                : 'Пользователи не могут крутить колесо. При попытке получат сообщение с ссылкой на Telegram бот'}
            </p>
          </div>
          <button
            onClick={toggleSettings}
            disabled={loadingSettings}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              border: 'none',
              cursor: loadingSettings ? 'not-allowed' : 'pointer',
              backgroundColor: isEnabled ? '#DC2626' : '#10B981',
              color: 'white',
              opacity: loadingSettings ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loadingSettings ? 'Обновление...' : (isEnabled ? 'Отключить' : 'Включить')}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            🎰 Колесо Фортуны
          </h1>
          {/* Кнопки управления вероятностями */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!editMode ? (
              <button
                onClick={startEditMode}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  backgroundColor: '#4F46E5',
                  color: 'white'
                }}
              >
                ✏️ Редактировать вероятности
              </button>
            ) : (
              <>
                <button
                  onClick={cancelEditMode}
                  disabled={savingProbabilities}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB',
                    cursor: savingProbabilities ? 'not-allowed' : 'pointer',
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280'
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={saveProbabilities}
                  disabled={savingProbabilities || Math.abs(editedTotalProbability - 100) > 0.01}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: (savingProbabilities || Math.abs(editedTotalProbability - 100) > 0.01) ? 'not-allowed' : 'pointer',
                    backgroundColor: Math.abs(editedTotalProbability - 100) > 0.01 ? '#9CA3AF' : '#10B981',
                    color: 'white',
                    opacity: (savingProbabilities || Math.abs(editedTotalProbability - 100) > 0.01) ? 0.6 : 1
                  }}
                >
                  {savingProbabilities ? 'Сохранение...' : '✓ Сохранить'}
                </button>
              </>
            )}
          </div>
        </div>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>
          Всего призов: <strong>{prizes.length}</strong> | Общая вероятность: <strong>{editMode ? editedTotalProbability.toFixed(1) : totalProbability}%</strong> 
          {(editMode ? Math.abs(editedTotalProbability - 100) < 0.01 : totalProbability === 100) ? (
            <span style={{ color: '#10B981', marginLeft: '8px' }}>✓ Корректно</span>
          ) : (
            <span style={{ color: '#DC2626', marginLeft: '8px' }}>⚠️ Должно быть 100%</span>
          )}
        </p>
      </div>

      {prizes.length === 0 ? (
        <div style={{ 
          background: 'white', 
          padding: '60px', 
          borderRadius: '12px', 
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎰</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1F2937' }}>
            Нет призов
          </h3>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Призы создаются программно через API endpoint /api/admin/fortune-wheel/seed-prizes
          </p>
        </div>
      ) : (
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
                  Значение
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Вероятность
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Срок
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((prize, index) => (
                <tr key={prize._id} style={{ borderBottom: index < prizes.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                        {prize.name}
                      </div>
                      {prize.description && (
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {prize.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: prize.type === 'extraSpin' ? '#FEF3C7' : '#F3F4F6',
                      color: prize.type === 'extraSpin' ? '#92400E' : '#374151'
                    }}>
                      {getTypeLabel(prize.type)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontWeight: '500' }}>
                    {typeof prize.value === 'number' ? prize.value : 
                     typeof prize.value === 'string' ? <span style={{ fontSize: '11px' }}>{prize.value}</span> :
                     '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editedProbabilities[prize._id] !== undefined ? editedProbabilities[prize._id] : prize.probability}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setEditedProbabilities({
                            ...editedProbabilities,
                            [prize._id]: value
                          });
                        }}
                        style={{
                          width: '80px',
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: '2px solid #4F46E5',
                          borderRadius: '6px',
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <span style={{ 
                        color: '#1F2937', 
                        fontWeight: '700',
                        fontSize: '16px'
                      }}>
                        {prize.probability}%
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                    {prize.validityDays ? `${prize.validityDays} дн.` : '-'}
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
                      {prize.isActive ? '✓ Активен' : '✗ Неактивен'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: '#EEF2FF', 
        borderRadius: '8px',
        fontSize: '13px',
        color: '#4F46E5'
      }}>
        <strong>ℹ️ Информация:</strong> Призы управляются через backend API. Для изменения призов используйте endpoints:
        <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
          <li><code>/api/admin/fortune-wheel/seed-prizes</code> - создать начальные призы</li>
          <li><code>/api/admin/fortune-wheel/delete-all-prizes</code> - удалить все призы</li>
          <li><code>/api/admin/fortune-wheel/recreate-prizes</code> - пересоздать все 15 призов</li>
        </ul>
      </div>

      {/* Секция победителей */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            🏆 Недавние победители
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Последние 20 выигрышей
          </p>
        </div>

        {loadingWinners ? (
          <div style={{ 
            background: 'white', 
            padding: '40px', 
            borderRadius: '12px', 
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#6B7280' }}>Загрузка победителей...</p>
          </div>
        ) : winners.length === 0 ? (
          <div style={{ 
            background: 'white', 
            padding: '60px', 
            borderRadius: '12px', 
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1F2937' }}>
              Пока нет победителей
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Победители появятся, когда пользователи начнут крутить колесо
            </p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Пользователь
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Приз
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Тип
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Значение
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Дата выигрыша
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner, index) => {
                  const wonDate = new Date(winner.wonAt);
                  const expiryDate = new Date(winner.expiryDate);
                  const isExpired = expiryDate < new Date();
                  
                  return (
                    <tr key={winner._id} style={{ borderBottom: index < winners.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                            {winner.user.name}
                          </div>
                          {winner.user.email && (
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              {winner.user.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                            {winner.prize.name}
                          </div>
                          {winner.prize.description && (
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              {winner.prize.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: winner.prize.type === 'extraSpin' ? '#FEF3C7' : 
                                     winner.prize.type === 'discount' ? '#DBEAFE' :
                                     winner.prize.type === 'freeProduct' ? '#FCE7F3' :
                                     '#F3F4F6',
                          color: winner.prize.type === 'extraSpin' ? '#92400E' : 
                                winner.prize.type === 'discount' ? '#1E3A8A' :
                                winner.prize.type === 'freeProduct' ? '#831843' :
                                '#374151'
                        }}>
                          {getTypeLabel(winner.prize.type)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontWeight: '500' }}>
                        {winner.prize.type === 'discount' ? `${winner.prize.value}%` : 
                         winner.prize.type === 'extraSpin' ? `+${winner.prize.value}` :
                         typeof winner.prize.value === 'string' ? 
                           <span style={{ fontSize: '11px' }}>{winner.prize.value}</span> :
                         '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: '500' }}>
                          {wonDate.toLocaleString('ru-RU', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                          Истекает: {expiryDate.toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: winner.isUsed ? '#D1FAE5' : 
                                     isExpired ? '#FEE2E2' : 
                                     '#FEF3C7',
                          color: winner.isUsed ? '#065F46' : 
                                isExpired ? '#991B1B' : 
                                '#92400E'
                        }}>
                          {winner.isUsed ? '✓ Использован' : 
                           isExpired ? '⏱ Истек' : 
                           '⏳ Ожидает'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
