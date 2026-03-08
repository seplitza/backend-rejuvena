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

export default function FortuneWheel() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrizes();
  }, []);

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

  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);

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
    <div className="container" style={{ padding: '40px', maxWidth    <div classNain: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          🎰 Колесо Фортуны
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>
          Всего призов: <strong>{prizes.length}</strong> | Общая вероятность: <strong>{totalProbability}%</strong> 
          {totalProbability === 100 ? (
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
          <h3 style={{          <h3 style={{          <h3 style=inB          <h3 style={{          <h3 style={{          <h3 style=inB          </h3>
          <h3 style={{          <h3 sty fontSize: '14px' }}>
            Призы создаются программно через API endpoint /api/admin/fortune-wheel/seed-prizes
          </p>
        </div>
      ) : (
        <div style={{ background        <div style={{ background     flo        <div style={{ background        <div style={{ background     flo        <div style={{%',        <div se: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  h style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Приз
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Тип
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSiz                <th style={{ padding: '12px 16, textTransform: 'uppercase' }}>
                  Значение
                </th>
                <th style={{ padding: '12px 16px'             'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
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
                <tr key={prize._id} style={{ borderBottom: inde                <tr key={prize._id} style={{ borderBottom: inde                <tr key={prize._id} style={{ borderBottom: inde                <tr key={prize<d                <tr key={prize._olor: '#1F2937', marginBo                <tr key={prize._id} style={{ borderBottom: inde                <tr key={prize._id} style={{ borderBottom: inde                <tr key={prize style={{ fontSize: '12px', color: '#6B7280                <tr                   <tr key={prize._id} style={{ borderBottom: inde                <tr key={prize._id} style={{ borderBottom: inde                <tr key={prizetd style={{ padding: '16px',                 <t' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      back                 e ==   extraSpin' ? '#FE                      back               color: prize.type === 'extraSpin' ? '#92400E' : '#374151'
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
                    <span style={{ 
                      color: '#1F2937', 
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      {prize.probability}%
                    </span>
                  </td>
                                         16                                         16                                         16                                         16                                   td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>                  <td styl s                  <td         padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: prize.isActive ? '#D1FAE5' : '#F3F4F6',
                      color: prize.isActive ? '#065F46' : '#6B7280'
                    }}>
                      {prize.isActive ? '✓ Активен' : '✗ Неактивен'}
                    </span>
                                                                                               </                                      <                      ma                                        ',                         EF2F                      iu                                                                                               </                                      <                      ma                                        ',       п                                                                                               </                                pi/admin/fortune-wheel/seed-prizes</code> - создать нач                                       <             /admin/fortune-wheel/delete-all-prizes</code> - удалить все призы</li>
          <li><code>/api/admin/fortune-wheel/recreate-prizes</code> - пересоздать все 15 призов</li>
        </ul>
      </div>
    </div>
  );
}
