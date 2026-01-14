/**
 * Payment Success Page
 * Страница успешной оплаты - /payment/success
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PaymentSuccess() {
  const router = useRouter();
  const { orderId } = router.query;
  
  const [status, setStatus] = useState<'checking' | 'processing' | 'succeeded' | 'failed' | 'error'>('checking');
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setStatus('error');
          return;
        }

        const response = await fetch(
          `https://api-rejuvena.duckdns.org/api/payment/status/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const data = await response.json();
        
        if (data.success && data.payment) {
          setPayment(data.payment);
          setStatus(data.payment.status);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    checkStatus();
    
    // Проверяем статус каждые 3 секунды, пока он не изменится
    const interval = setInterval(() => {
      if (status === 'checking' || status === 'processing') {
        checkStatus();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Checking Status */}
        {status === 'checking' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg className="animate-spin w-20 h-20 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Проверка статуса платежа</h2>
            <p className="text-gray-600">Пожалуйста, подождите...</p>
          </div>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <svg className="animate-pulse w-20 h-20 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Обработка платежа</h2>
            <p className="text-gray-600">Ваш платеж обрабатывается. Это может занять несколько секунд.</p>
          </div>
        )}

        {/* Success */}
        {status === 'succeeded' && (
          <div>
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Оплата прошла успешно!</h2>
              <p className="text-green-100">Премиум доступ активирован</p>
            </div>

            {/* Success Details */}
            <div className="p-8">
              {payment && (
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Сумма:</span>
                    <span className="text-2xl font-bold text-gray-900">{payment.amount} ₽</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Описание:</span>
                    <span className="text-gray-900 font-medium">{payment.description}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Номер заказа:</span>
                    <span className="text-xs text-gray-500 font-mono">{payment.orderNumber}</span>
                  </div>
                </div>
              )}

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-purple-900 mb-2">✨ Теперь вам доступны:</h3>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Полные видео-инструкции всех упражнений</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Детальные описания техник</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Доступ на {payment?.metadata?.duration || 30} дней</span>
                  </li>
                </ul>
              </div>

              <Link 
                href="/exercises"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Перейти к упражнениям
              </Link>
            </div>
          </div>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div>
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Платеж не прошел</h2>
              <p className="text-red-100">Произошла ошибка при обработке платежа</p>
            </div>

            <div className="p-8">
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Платеж был отклонен. Возможные причины:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  <li>• Недостаточно средств на карте</li>
                  <li>• Карта заблокирована или просрочена</li>
                  <li>• Введены неверные данные карты</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Link 
                  href="/"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Попробовать снова
                </Link>
                <Link 
                  href="/exercises"
                  className="flex-1 bg-gray-100 text-gray-700 text-center font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Вернуться
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div>
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Ошибка</h2>
              <p className="text-orange-100">Не удалось проверить статус платежа</p>
            </div>

            <div className="p-8">
              <p className="text-gray-600 mb-6 text-center">
                Пожалуйста, проверьте историю платежей в личном кабинете или обратитесь в поддержку.
              </p>

              <Link 
                href="/"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Вернуться на главную
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
