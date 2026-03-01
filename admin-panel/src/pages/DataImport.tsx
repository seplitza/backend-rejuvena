import { useState } from 'react';
import api from '../api/client';

interface PreviewData {
  preview: any[];
  totalRecords: number;
  detectedType: 'orders' | 'payments' | 'users' | 'unknown';
  fields: string[];
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{
    record: any;
    error: string;
  }>;
}

interface ImportHistory {
  timestamp: Date;
  dataType: string;
  totalRecords: number;
  imported: number;
  skipped: number;
  errors: number;
}

export default function DataImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<'insert' | 'upsert' | 'replace'>('upsert');
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Column mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  // System fields for different data types
  const getSystemFields = (dataType: string) => {
    const fieldMaps: Record<string, Array<{ value: string; label: string }>> = {
      orders: [
        { value: 'orderNumber', label: 'Номер заказа' },
        { value: 'email', label: 'Email клиента' },
        { value: 'fullName', label: 'ФИО клиента' },
        { value: 'phone', label: 'Телефон' },
        { value: 'deliveryAddress', label: 'Адрес доставки' },
        { value: 'totalAmount', label: 'Сумма заказа' },
        { value: 'paymentStatus', label: 'Статус оплаты' },
        { value: 'items', label: 'Товары' },
        { value: 'date', label: 'Дата заказа' },
        { value: 'discount', label: 'Скидка' },
        { value: 'shippingCost', label: 'Стоимость доставки' },
      ],
      users: [
        { value: 'email', label: 'Email' },
        { value: 'firstName', label: 'Имя' },
        { value: 'lastName', label: 'Фамилия' },
        { value: 'phone', label: 'Телефон' },
        { value: 'role', label: 'Роль' },
      ],
      payments: [
        { value: 'amount', label: 'Сумма' },
        { value: 'currency', label: 'Валюта' },
        { value: 'status', label: 'Статус' },
        { value: 'method', label: 'Метод оплаты' },
        { value: 'date', label: 'Дата' },
      ],
    };
    return fieldMaps[dataType] || [];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setImportResult(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setImportResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const previewImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/admin/data-import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 минуты для обработки больших файлов
      });

      if (response.data.success) {
        const data = response.data.data;
        setPreviewData(data);
        
        // Auto-map columns based on field names
        const autoMapping: Record<string, string> = {};
        const systemFields = getSystemFields(data.detectedType);
        const selectedCols = new Set<string>();
        
        data.fields.forEach((field: string) => {
          const fieldLower = field.toLowerCase();
          
          // Try to match field names
          const match = systemFields.find(sf => {
            const sfLower = sf.value.toLowerCase();
            const labelLower = sf.label.toLowerCase();
            return fieldLower.includes(sfLower) || 
                   sfLower.includes(fieldLower) ||
                   fieldLower.includes(labelLower) ||
                   labelLower.includes(fieldLower);
          });
          
          if (match) {
            autoMapping[field] = match.value;
            selectedCols.add(field);
          }
        });
        
        setColumnMapping(autoMapping);
        setSelectedColumns(selectedCols);
      } else {
        alert(`Ошибка предпросмотра: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error previewing import:', error);
      alert('Ошибка предпросмотра: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
  };

  const executeImport = async () => {
    if (!selectedFile || !previewData) return;

    const selectedCount = selectedColumns.size;
    if (selectedCount === 0) {
      alert('Выберите хотя бы один столбец для импорта');
      return;
    }

    if (!confirm(`Импортировать ${previewData.totalRecords} записей (выбрано столбцов: ${selectedCount}, режим: ${importMode})?`)) {
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mode', importMode);
      formData.append('dataType', previewData.detectedType);
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('selectedColumns', JSON.stringify(Array.from(selectedColumns)));

      const response = await api.post('/admin/data-import/execute', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 минут для импорта больших файлов
      });

      if (response.data.success) {
        setImportResult(response.data.data);
        alert(`Импорт завершен!\nИмпортировано: ${response.data.data.imported}\nПропущено: ${response.data.data.skipped}\nОшибки: ${response.data.data.errors}`);
        
        // Reset file selection after successful import
        setSelectedFile(null);
        setPreviewData(null);
        setColumnMapping({});
        setSelectedColumns(new Set());
      } else {
        alert(`Ошибка импорта: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error executing import:', error);
      alert('Ошибка импорта: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/admin/data-import/history');

      if (response.data.success) {
        setHistory(response.data.data.history || []);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      alert('Ошибка загрузки истории: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (tab: 'import' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      loadHistory();
    }
  };

  const getDataTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      orders: 'Заказы',
      payments: 'Платежи',
      users: 'Пользователи',
      unknown: 'Неизвестно'
    };
    return labels[type] || type;
  };

  const getImportModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      insert: 'Только новые (пропустить существующие)',
      upsert: 'Обновить существующие + добавить новые',
      replace: 'Удалить все и заменить новыми'
    };
    return labels[mode] || mode;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Импорт данных из файлов</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('import')}
            className={`${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Импорт
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            История
          </button>
        </nav>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* File Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Выбор файла</h2>
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewData(null);
                      setImportResult(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Удалить файл
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-base text-gray-600">Перетащите файл сюда или</p>
                  <label className="inline-block">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                      Выберите файл
                    </span>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">CSV или JSON (максимум 10MB)</p>
                </div>
              )}
            </div>

            {selectedFile && !previewData && (
              <div className="mt-4">
                <button
                  onClick={previewImport}
                  disabled={importing}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {importing ? 'Загрузка предпросмотра...' : 'Предпросмотр'}
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {previewData && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Предпросмотр данных</h2>
              
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Тип данных</p>
                  <p className="text-lg font-semibold">{getDataTypeLabel(previewData.detectedType)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Всего записей</p>
                  <p className="text-lg font-semibold">{previewData.totalRecords}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Полей</p>
                  <p className="text-lg font-semibold">{previewData.fields.length}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-md font-semibold mb-3">Маппинг колонок</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Выберите какие столбцы импортировать и укажите соответствие полям системы
                </p>
                
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-3">
                  {previewData.fields.map((field) => (
                    <div key={field} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(field)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedColumns);
                          if (e.target.checked) {
                            newSelected.add(field);
                          } else {
                            newSelected.delete(field);
                          }
                          setSelectedColumns(newSelected);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1 grid grid-cols-2 gap-3 items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{field}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({previewData.preview[0]?.[field]?.toString().substring(0, 30) || 'пусто'}...)
                          </span>
                        </div>
                        <select
                          value={columnMapping[field] || ''}
                          onChange={(e) => {
                            setColumnMapping({
                              ...columnMapping,
                              [field]: e.target.value
                            });
                          }}
                          disabled={!selectedColumns.has(field)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="">→ Не импортировать</option>
                          {getSystemFields(previewData.detectedType).map((sf) => (
                            <option key={sf.value} value={sf.value}>
                              → {sf.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Режим импорта
                </label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="insert">Только новые записи</option>
                  <option value="upsert">Обновить существующие + добавить новые</option>
                  <option value="replace">⚠️ Удалить все и заменить</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {getImportModeLabel(importMode)}
                </p>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData.fields.map((field) => (
                        <th
                          key={field}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                          style={{ maxWidth: '200px' }}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selectedColumns.has(field)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedColumns);
                                  if (e.target.checked) {
                                    newSelected.add(field);
                                  } else {
                                    newSelected.delete(field);
                                  }
                                  setSelectedColumns(newSelected);
                                }}
                                className="w-3 h-3"
                                title={selectedColumns.has(field) ? 'Импортировать' : 'Не импортировать'}
                              />
                              <span className="break-words">{field}</span>
                            </div>
                            {columnMapping[field] && selectedColumns.has(field) && (
                              <span className="text-[10px] text-blue-600 font-normal">
                                → {getSystemFields(previewData.detectedType).find(f => f.value === columnMapping[field])?.label}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.preview.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {previewData.fields.map((field) => (
                          <td 
                            key={field} 
                            className={`px-3 py-2 text-xs text-gray-700 border-r border-gray-200 last:border-r-0 ${
                              selectedColumns.has(field) ? 'bg-blue-50' : 'opacity-50'
                            }`}
                            style={{ 
                              maxWidth: '200px',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal',
                              overflowWrap: 'break-word'
                            }}
                          >
                            {typeof row[field] === 'object' 
                              ? JSON.stringify(row[field]).substring(0, 100) + '...'
                              : String(row[field] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.totalRecords > 10 && (
                <p className="text-sm text-gray-500 mb-4">
                  Показаны первые 10 записей из {previewData.totalRecords}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={executeImport}
                  disabled={importing || selectedColumns.size === 0}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing 
                    ? 'Импорт...' 
                    : selectedColumns.size === 0 
                      ? 'Выберите столбцы для импорта' 
                      : `Импортировать ${previewData.totalRecords} записей (${selectedColumns.size} столбцов)`
                  }
                </button>
                <button
                  onClick={() => {
                    setPreviewData(null);
                    setSelectedFile(null);
                    setColumnMapping({});
                    setSelectedColumns(new Set());
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Результаты импорта</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="text-sm text-green-600">Импортировано</p>
                  <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-600">Пропущено</p>
                  <p className="text-2xl font-bold text-yellow-700">{importResult.skipped}</p>
                </div>
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <p className="text-sm text-red-600">Ошибки</p>
                  <p className="text-2xl font-bold text-red-700">{importResult.errors}</p>
                </div>
              </div>

              {importResult.errorDetails.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Детали ошибок:</h3>
                  <div className="bg-red-50 border border-red-200 rounded p-4 max-h-64 overflow-y-auto">
                    {importResult.errorDetails.map((error, idx) => (
                      <div key={idx} className="mb-3 pb-3 border-b border-red-200 last:border-0">
                        <p className="text-sm font-medium text-red-800">Ошибка: {error.error}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Запись: {JSON.stringify(error.record).substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Справка</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Поддерживаемые форматы: CSV (с различными разделителями), JSON</li>
              <li>• Система автоматически определяет тип данных и сопоставляет поля</li>
              <li>• Русские заголовки автоматически преобразуются в английские</li>
              <li>• Режим "upsert" рекомендован для обновления без потери данных</li>
              <li>• Максимальный размер файла: 10MB</li>
            </ul>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">История импорта</h2>
          
          {loadingHistory ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка истории...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">История импорта пуста</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата/Время</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип данных</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Всего</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Импортировано</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пропущено</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ошибки</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.timestamp).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDataTypeLabel(item.dataType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalRecords}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {item.imported}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        {item.skipped}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {item.errors}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
