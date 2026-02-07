import React, { useState } from 'react';
import api from '../api/client';

interface ImageUploadProps {
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  label?: string;
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentUrl,
  onUrlChange,
  label = 'Изображение',
  accept = 'image/*'
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000, // 60 секунд для загрузки
        onUploadProgress: (progressEvent) => {
          // Можно добавить прогресс-бар если нужно
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });

      if (response.data.url) {
        // Бэкенд возвращает относительный URL (/uploads/...), нужно сделать абсолютный
        const baseUrl = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace('/api', '') // Убираем /api из конца
          : 'http://localhost:9527';
        const fullUrl = response.data.url.startsWith('http') 
          ? response.data.url 
          : `${baseUrl}${response.data.url}`;
        onUrlChange(fullUrl);
      } else {
        throw new Error('Не удалось получить URL изображения');
      }
    } catch (err: any) {
      let errorMessage = 'Ошибка загрузки файла';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания. Попробуйте загрузить файл меньшего размера или проверьте соединение.';
      } else if (err.response?.status === 413) {
        errorMessage = 'Файл слишком большой. Максимальный размер: 50MB';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={currentUrl || ''}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <label className={`px-4 py-2 bg-purple-600 text-white rounded-md cursor-pointer hover:bg-purple-700 transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Загрузка...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Загрузить
            </>
          )}
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {currentUrl && (
        <div className="mt-3">
          <img 
            src={currentUrl} 
            alt="Preview" 
            className="max-w-xs max-h-40 rounded-md border border-gray-200 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
