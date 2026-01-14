/**
 * Payment Button Component - Alfabank Integration
 * Создает платеж и перенаправляет на Альфа-Банк
 */

import { useState } from 'react';

interface PaymentButtonProps {
  amount: number;
  planType: string;
  duration: number;
  buttonText?: string;
  className?: string;
}

export default function PaymentButton({ 
  amount, 
  planType, 
  duration,
  buttonText = `Оплатить ${amount} ₽`,
  className = ''
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        return;
      }

      const response = await fetch('https://api-rejuvena.duckdns.org/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          description: `Премиум подписка на ${duration} дней`,
          planType: planType,
          duration: duration
        })
      });

      const data = await response.json();
      
      if (data.success && data.payment?.paymentUrl) {
        // Перенаправляем на страницу оплаты Альфа-Банка
        window.location.href = data.payment.paymentUrl;
      } else {
        setError(data.error || 'Не удалось создать платеж');
        setLoading(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Ошибка при создании платежа');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${className}`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Создание платежа...
          </span>
        ) : (
          buttonText
        )}
      </button>
      {error && (
        <div className="mt-2 text-red-600 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
