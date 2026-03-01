import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

interface WBProduct {
  nmId: number;
  vendorCode: string;
  sizes: Array<{
    techSize: string;
    price: number;
    discountedPrice: number;
  }>;
}

interface SalesReportItem {
  date: string;
  subject: string;
  barcode: string;
  quantity: number;
  totalPrice: number;
  discountPercent: number;
  isStorno: boolean;
  supplierArticle: string;
  techSize: string;
  warehouseName: string;
  countryName: string;
  oblastOkrugName: string;
  regionName: string;
}

const WildberriesIntegration: React.FC = () => {
  const [status, setStatus] = useState<string>('Проверка...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [nmId, setNmId] = useState<string>('');
  const [productInfo, setProductInfo] = useState<WBProduct | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReportItem[]>([]);
  const [syncResult, setSyncResult] = useState<string>('');
  const [apiToken, setApiToken] = useState<string>('');
  const [tokenSaving, setTokenSaving] = useState<boolean>(false);

  const getAuthHeader = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    checkConnection();
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const response = await axios.get('/api/admin/wildberries/token', {
        headers: getAuthHeader()
      });
      if (response.data.token) {
        setApiToken(response.data.token);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const saveToken = async () => {
    if (!apiToken.trim()) {
      alert('Введите токен API');
      return;
    }

    setTokenSaving(true);
    try {
      await axios.post('/api/admin/wildberries/token', 
        { token: apiToken },
        { headers: getAuthHeader() }
      );
      alert('Токен успешно сохранен');
      checkConnection();
    } catch (error: any) {
      alert('Ошибка сохранения токена: ' + (error.response?.data?.error || error.message));
    } finally {
      setTokenSaving(false);
    }
  };

  const checkConnection = async () => {
    try {
      const response = await axios.get('/api/admin/wildberries/status', {
        headers: getAuthHeader()
      });
      setIsConnected(response.data.connected);
      setStatus(response.data.message);
    } catch (error: any) {
      setIsConnected(false);
      setStatus('Ошибка подключения: ' + (error.response?.data?.error || error.message));
    }
  };

  const syncAllPrices = async () => {
    setLoading(true);
    setSyncResult('');
    try {
      const response = await axios.post('/api/admin/wildberries/sync-prices', {}, {
        headers: getAuthHeader()
      });
      setSyncResult(`Успешно обновлено: ${response.data.synced}, Ошибок: ${response.data.errors}`);
      if (response.data.details) {
        console.log('Детали синхронизации:', response.data.details);
      }
    } catch (error: any) {
      setSyncResult('Ошибка синхронизации: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getProductByNmId = async () => {
    if (!nmId) return;
    
    setLoading(true);
    setProductInfo(null);
    try {
      const response = await axios.get(`/api/admin/wildberries/product/${nmId}`, {
        headers: getAuthHeader()
      });
      setProductInfo(response.data);
    } catch (error: any) {
      alert('Ошибка получения товара: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getSalesReport = async () => {
    setLoading(true);
    setSalesReport([]);
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30); // Последние 30 дней
      
      const response = await axios.get('/api/admin/wildberries/sales-report', {
        params: {
          dateFrom: dateFrom.toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0]
        },
        headers: getAuthHeader()
      });
      setSalesReport(response.data);
    } catch (error: any) {
      alert('Ошибка получения отчета: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const totalSales = salesReport.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQuantity = salesReport.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Интеграция с Wildberries</h1>

      {/* Настройка API токена */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Настройка API токена</h2>
        <p className="text-gray-600 mb-4">
          Введите токен API Wildberries для подключения к маркетплейсу.
          Токен можно получить в личном кабинете продавца.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Введите WB_API_TOKEN"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={saveToken}
            disabled={tokenSaving}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {tokenSaving ? 'Сохранение...' : 'Сохранить токен'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          💡 Токен будет сохранен в безопасном хранилище и использоваться для всех запросов к API
        </p>
      </div>

      {/* Статус подключения */}
      <div className={`p-4 rounded-lg mb-6 ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
        <h2 className="text-xl font-semibold mb-2">
          {isConnected ? '✅ Подключено' : '❌ Не подключено'}
        </h2>
        <p>{status}</p>
        <button
          onClick={checkConnection}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Проверить подключение
        </button>
      </div>

      {/* Синхронизация цен */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-semibold mb-4">Синхронизация цен</h2>
        <p className="text-gray-600 mb-4">
          Синхронизирует цены всех товаров с артикулами WB из базы данных
        </p>
        <button
          onClick={syncAllPrices}
          disabled={loading || !isConnected}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Синхронизация...' : 'Синхронизировать все цены'}
        </button>
        {syncResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            {syncResult}
          </div>
        )}
      </div>

      {/* Поиск товара по номенклатуре */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-semibold mb-4">Информация о товаре</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={nmId}
            onChange={(e) => setNmId(e.target.value)}
            placeholder="Введите номер номенклатуры (nmId)"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={getProductByNmId}
            disabled={loading || !isConnected || !nmId}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Получить
          </button>
        </div>

        {productInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Артикул: {productInfo.vendorCode}</h3>
            <p className="text-sm text-gray-600 mb-3">Номенклатура: {productInfo.nmId}</p>
            
            {productInfo.sizes && productInfo.sizes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Размеры и цены:</h4>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Размер</th>
                      <th className="p-2 text-right">Полная цена</th>
                      <th className="p-2 text-right">Со скидкой</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productInfo.sizes.map((size, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{size.techSize}</td>
                        <td className="p-2 text-right">{size.price} ₽</td>
                        <td className="p-2 text-right font-semibold">{size.discountedPrice} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Отчет по продажам */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Отчет по продажам (30 дней)</h2>
        <button
          onClick={getSalesReport}
          disabled={loading || !isConnected}
          className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 mb-4"
        >
          {loading ? 'Загрузка...' : 'Получить отчет'}
        </button>

        {salesReport.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded">
              <div>
                <h3 className="text-lg font-semibold">Всего продаж:</h3>
                <p className="text-3xl font-bold text-green-600">{totalQuantity} шт</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Сумма продаж:</h3>
                <p className="text-3xl font-bold text-blue-600">{totalSales.toFixed(2)} ₽</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Дата</th>
                    <th className="p-2 text-left">Товар</th>
                    <th className="p-2 text-left">Артикул</th>
                    <th className="p-2 text-right">Кол-во</th>
                    <th className="p-2 text-right">Сумма</th>
                    <th className="p-2 text-left">Регион</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.slice(0, 50).map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-2">{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                      <td className="p-2">{item.subject}</td>
                      <td className="p-2">{item.supplierArticle}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right font-semibold">{item.totalPrice.toFixed(2)} ₽</td>
                      <td className="p-2 text-sm text-gray-600">{item.regionName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesReport.length > 50 && (
                <p className="text-center text-gray-500 mt-2">
                  Показано 50 из {salesReport.length} продаж
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WildberriesIntegration;
