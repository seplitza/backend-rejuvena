/**
 * Updated PaymentModal Component - Supports Premium, Exercises, and Marathons
 * Unified payment flow for all product types
 */

import { useState, useEffect } from 'react';
import { API_URL } from '@/config/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType: 'premium' | 'exercise' | 'marathon';
  productId?: string;
  productName: string;
  price: number;
  onPaymentSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  productType,
  productId,
  productName,
  price,
  onPaymentSuccess
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      // Determine endpoint based on product type
      let endpoint = '';
      let body: any = {};

      if (productType === 'premium') {
        endpoint = `${API_URL}/api/payment/create`;
        body = {
          amount: price,
          description: 'Премиум подписка',
          planType: 'premium',
          duration: 30 // 30 days
        };
      } else if (productType === 'exercise') {
        endpoint = `${API_URL}/api/payment/create-exercise`;
        body = {
          exerciseId: productId,
          exerciseName: productName,
          price
        };
      } else if (productType === 'marathon') {
        endpoint = `${API_URL}/api/payment/create-marathon`;
        body = {
          marathonId: productId,
          marathonName: productName,
          price
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании платежа');
      }

      const data = await response.json();

      if (!data.payment?.paymentUrl) {
        throw new Error('Не получена ссылка для оплаты');
      }

      // Redirect to payment page
      window.location.href = data.payment.paymentUrl;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при оплате');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getProductIcon = () => {
    switch (productType) {
      case 'premium': return '⭐';
      case 'exercise': return '💪';
      case 'marathon': return '🏃';
      default: return '💳';
    }
  };

  const getProductTypeLabel = () => {
    switch (productType) {
      case 'premium': return 'Премиум подписка';
      case 'exercise': return 'Упражнение';
      case 'marathon': return 'Марафон';
      default: return 'Покупка';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '20px'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 9999
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {getProductIcon()} Оплата
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#6B7280',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Product Info */}
            <div style={{
              background: '#F9FAFB',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                {getProductTypeLabel()}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                {productName}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <div style={{ fontSize: '16px', color: '#6B7280' }}>
                  Итого к оплате:
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4F46E5' }}>
                  {price} ₽
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Способ оплаты
              </div>
              <div style={{
                padding: '16px',
                border: '2px solid #4F46E5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ fontSize: '24px' }}>💳</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                    Альфа-банк
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    Банковская карта (Visa, MasterCard, МИР)
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                ❌ {error}
              </div>
            )}

            {/* Info */}
            <div style={{
              padding: '16px',
              background: '#EEF2FF',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', color: '#4F46E5', lineHeight: '1.6' }}>
                ℹ️ После нажатия кнопки "Оплатить" вы будете перенаправлены на защищённую страницу оплаты Альфа-банка. 
                {productType === 'marathon' && ' После успешной оплаты вы будете автоматически записаны на марафон.'}
                {productType === 'exercise' && ' После успешной оплаты упражнение станет доступным в течение 30 дней.'}
                {productType === 'premium' && ' После успешной оплаты премиум-доступ будет активирован на 30 дней.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Отмена
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: loading ? '#9CA3AF' : '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Загрузка...' : `Оплатить ${price} ₽`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
