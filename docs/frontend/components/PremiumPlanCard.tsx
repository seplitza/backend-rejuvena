/**
 * Premium Plan Card - Complete Component
 * Карточка премиум подписки с интеграцией Альфа-Банк
 */

import { useState } from 'react';

export default function PremiumPlanCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
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
          amount: 990,
          description: 'Премиум подписка на 30 дней - Полный доступ ко всем упражнениям',
          planType: 'premium',
          duration: 30
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
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-200 hover:border-purple-400 transition-all duration-300">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold">Премиум доступ</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">
              ⭐ Популярный
            </span>
          </div>
          <p className="text-purple-100">Полный доступ ко всем упражнениям</p>
        </div>

        {/* Features */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Полное видео-инструкция</h4>
                <p className="text-sm text-gray-600">Детальная демонстрация каждого упражнения</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Детальное описание техники</h4>
                <p className="text-sm text-gray-600">Пошаговые инструкции и рекомендации</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Доступ на 1 месяц</h4>
                <p className="text-sm text-gray-600">30 дней неограниченного доступа</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Все категории упражнений</h4>
                <p className="text-sm text-gray-600">Шея, лицо, губы, челюсть и другие</p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-gray-600 text-sm">Всего за</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">990</span>
                  <span className="text-xl text-gray-600">₽</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">≈ 33 ₽/день</span>
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
              <>
                <span className="text-lg">Оплатить 990 ₽</span>
                <span className="block text-xs opacity-90 mt-1">Безопасная оплата через Альфа-Банк</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Security badges */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Безопасно
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Альфа-Банк
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
