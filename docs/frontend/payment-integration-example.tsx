// Простой пример интеграции оплаты на фронтенде

// 1. Компонент кнопки оплаты
export function PaymentButton({ amount, planType, duration }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
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
      
      if (data.success && data.payment.paymentUrl) {
        // Перенаправляем на страницу оплаты Альфа-Банка
        window.location.href = data.payment.paymentUrl;
      } else {
        setError('Не удалось создать платеж');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Ошибка при создании платежа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="payment-button"
      >
        {loading ? 'Создание платежа...' : `Оплатить ${amount} ₽`}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

// 2. Страница успешной оплаты (/payment/success)
export function PaymentSuccessPage() {
  const [status, setStatus] = useState('checking');
  const [payment, setPayment] = useState(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
      setStatus('error');
      return;
    }

    // Проверяем статус платежа
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `https://api-rejuvena.duckdns.org/api/payment/status/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const data = await response.json();
        setPayment(data.payment);
        setStatus(data.payment.status);
      } catch (error) {
        console.error('Error checking status:', error);
        setStatus('error');
      }
    };

    checkStatus();
    
    // Проверяем каждые 3 секунды, пока статус не изменится
    const interval = setInterval(() => {
      if (status === 'checking' || status === 'processing') {
        checkStatus();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="payment-result">
      {status === 'checking' && (
        <div>
          <h2>Проверка статуса платежа...</h2>
          <div className="spinner"></div>
        </div>
      )}
      
      {status === 'processing' && (
        <div>
          <h2>Обработка платежа...</h2>
          <p>Пожалуйста, подождите</p>
        </div>
      )}
      
      {status === 'succeeded' && (
        <div className="success">
          <h2>✅ Оплата прошла успешно!</h2>
          <p>Премиум доступ активирован</p>
          <p>Сумма: {payment?.amount} ₽</p>
          <button onClick={() => window.location.href = '/exercises'}>
            Перейти к упражнениям
          </button>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="error">
          <h2>❌ Платеж не прошел</h2>
          <p>Попробуйте еще раз или используйте другую карту</p>
          <button onClick={() => window.location.href = '/'}>
            Вернуться на главную
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <h2>Ошибка</h2>
          <p>Не удалось проверить статус платежа</p>
        </div>
      )}
    </div>
  );
}

// 3. История платежей
export function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          'https://api-rejuvena.duckdns.org/api/payment/history',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const data = await response.json();
        setPayments(data.payments);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="payment-history">
      <h2>История платежей</h2>
      {payments.length === 0 ? (
        <p>У вас пока нет платежей</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Описание</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td>{payment.description}</td>
                <td>{payment.amount} ₽</td>
                <td>
                  <span className={`status-${payment.status}`}>
                    {getStatusText(payment.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function getStatusText(status) {
  const statuses = {
    'pending': 'Ожидает оплаты',
    'processing': 'Обработка',
    'succeeded': 'Успешно',
    'failed': 'Отклонен',
    'refunded': 'Возврат',
    'cancelled': 'Отменен'
  };
  return statuses[status] || status;
}

// 4. Пример использования в главном компоненте подписки
export function PremiumPlanCard() {
  return (
    <div className="premium-card">
      <h3>Премиум подписка</h3>
      <div className="features">
        <div>✅ Полное видео-инструкция</div>
        <div>✅ Детальное описание техники</div>
        <div>✅ Доступ на 1 месяц</div>
      </div>
      <div className="price">990 ₽</div>
      
      <PaymentButton 
        amount={990}
        planType="premium"
        duration={30}
      />
    </div>
  );
}
