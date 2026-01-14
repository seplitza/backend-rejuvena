/**
 * Payment Fail Page
 * Страница ошибки оплаты - /payment/fail
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PaymentFail() {
  const router = useRouter();
  const { orderId, status, reason } = router.query;
  
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    // Определяем причину ошибки
    if (reason) {
      const reasons: Record<string, string> = {
        'missing_order_id': 'Отсутствует идентификатор заказа',
        'payment_not_found': 'Платеж не найден в системе',
        'internal_error': 'Внутренняя ошибка сервера'
      };
      setErrorDetails(reasons[reason as string] || 'Неизвестная ошибка');
    } else if (status) {
      const statuses: Record<string, string> = {
        'cancelled': 'Платеж был отменен',
        'failed': 'Платеж был отклонен банком',
        'pending': 'Платеж ожидает обработки'
      };
      setErrorDetails(statuses[status as string] || 'Ошибка при обработке платежа');
    } else {
      setErrorDetails('Произошла ошибка при обработке платежа');
    }
  }, [reason, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Error Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Платеж не выполнен</h2>
          <p className="text-red-100">Оплата не была завершена</p>
        </div>

        {/* Error Details */}
        <div className="p-8">
          {/* Error Message */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Что произошло?</h3>
                <p className="text-sm text-red-800">{errorDetails}</p>
              </div>
            </div>
          </div>

          {/* Possible Reasons */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Возможные причины:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Недостаточно средств на карте</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Карта заблокирована или просрочена</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Введены неверные данные карты</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Платеж был отменен пользователем</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Проблема на стороне платежной системы</span>
              </li>
            </ul>
          </div>

          {/* What to do */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Что делать?
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Проверьте данные карты и попробуйте снова</li>
              <li>• Используйте другую карту для оплаты</li>
              <li>• Свяжитесь с банком для уточнения причины</li>
              <li>• Обратитесь в нашу поддержку, если проблема сохраняется</li>
            </ul>
          </div>

          {/* Order ID if available */}
          {orderId && (
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500">
                Номер заказа: <span className="font-mono">{orderId}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link 
              href="/"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Попробовать снова
            </Link>
            
            <Link 
              href="/exercises"
              className="w-full bg-gray-100 text-gray-700 text-center font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Вернуться к упражнениям
            </Link>

            <Link 
              href="/support"
              className="w-full text-purple-600 text-center font-medium py-2 px-6 hover:text-purple-700 transition-colors text-sm"
            >
              Связаться с поддержкой →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
