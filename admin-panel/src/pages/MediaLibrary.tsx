import { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/auth';

interface MediaFile {
  _id: string;
  url: string;
  type: 'image' | 'video';
  mimeType: string;
  createdAt: string;
  filename: string;
}

const API_URL = window.location.origin;

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/media`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      alert('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Проверка всех файлов
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Проверка типа файла
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`"${file.name}" - можно загружать только изображения и видео`);
        continue;
      }

      // Проверка размера (макс 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`"${file.name}" - максимальный размер файла: 50MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Загружаем файлы последовательно (можно распараллелить при необходимости)
      for (const file of validFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const token = getAuthToken();
          const response = await fetch(`${API_URL}/api/media/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Ошибка загрузки ${file.name}:`, await response.text());
          }
        } catch (error) {
          errorCount++;
          console.error(`Ошибка загрузки ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        alert(`✅ Успешно загружено: ${successCount} из ${validFiles.length} файлов`);
        loadFiles(); // Перезагружаем список
      } else {
        alert('❌ Не удалось загрузить ни один файл');
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить файлы');
    } finally {
      setUploading(false);
      event.target.value = ''; // Сброс input
    }
  };

  const copyToClipboard = (url: string) => {
    const fullUrl = `${API_URL}${url}`;
    navigator.clipboard.writeText(fullUrl);
    alert('✅ Ссылка скопирована в буфер обмена!');
  };

  const deleteFile = async (id: string) => {
    if (!confirm('Удалить этот файл? Это действие нельзя отменить.')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Файл удалён');
        loadFiles();
      } else {
        alert('Ошибка удаления файла');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить файл');
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '30px' }}>
      {/* Заголовок */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
          📚 Медиабиблиотека
        </h1>
        <p style={{ color: '#6B7280' }}>
          Загружайте фото и видео, получайте ссылки для вставки на сайте
        </p>
      </div>

      {/* Панель управления */}
      <div style={{
        marginBottom: '30px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Кнопка загрузки */}
        <label style={{
          padding: '12px 24px',
          background: uploading ? '#9CA3AF' : '#4F46E5',
          color: 'white',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          display: 'inline-block'
        }}>
          {uploading ? '⏳ Загрузка...' : '📤 Загрузить файлы'}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>

        {/* Поиск */}
        <input
          type="text"
          placeholder="🔍 Поиск по имени файла..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            flex: '1',
            minWidth: '200px'
          }}
        />

        {/* Фильтр */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          style={{
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px'
          }}
        >
          <option value="all">Все файлы</option>
          <option value="image">🖼️ Изображения</option>
          <option value="video">🎥 Видео</option>
        </select>
      </div>

      {/* Статистика */}
      <div style={{
        marginBottom: '30px',
        padding: '16px 20px',
        background: '#F3F4F6',
        borderRadius: '8px',
        display: 'flex',
        gap: '30px'
      }}>
        <div>
          <span style={{ color: '#6B7280' }}>Всего файлов: </span>
          <strong>{files.length}</strong>
        </div>
        <div>
          <span style={{ color: '#6B7280' }}>Изображений: </span>
          <strong>{files.filter(f => f.type === 'image').length}</strong>
        </div>
        <div>
          <span style={{ color: '#6B7280' }}>Видео: </span>
          <strong>{files.filter(f => f.type === 'video').length}</strong>
        </div>
      </div>

      {/* Сетка файлов */}
      {filteredFiles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#9CA3AF'
        }}>
          {searchTerm || filterType !== 'all' 
            ? '🔍 Ничего не найдено' 
            : '📂 Медиабиблиотека пуста. Загрузите первый файл!'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredFiles.map(file => (
            <div
              key={file._id}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Превью */}
              <div style={{
                height: '200px',
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {file.type === 'image' ? (
                  <img
                    src={`${API_URL}${file.url}`}
                    alt={file.filename}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: '48px',
                    color: '#9CA3AF'
                  }}>
                    🎥
                  </div>
                )}
              </div>

              {/* Информация */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  wordBreak: 'break-word'
                }}>
                  {file.filename}
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginBottom: '12px'
                }}>
                  {new Date(file.createdAt).toLocaleDateString('ru-RU')}
                </div>

                {/* Кнопки действий */}
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    📋 Копировать URL
                  </button>
                  
                  <button
                    onClick={() => deleteFile(file._id)}
                    style={{
                      padding: '8px 12px',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🗑️
                  </button>
                </div>

                {/* URL для справки */}
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: '#F9FAFB',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#6B7280',
                  wordBreak: 'break-all'
                }}>
                  {file.url}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
