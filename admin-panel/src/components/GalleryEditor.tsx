 import React, { useState, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

interface GalleryImage {
  url: string;
  caption?: string;
  order: number;
  _tempId?: string; // Временный ID для новых изображений
}

interface GalleryEditorProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  sectionTitle?: string;
}

// Компонент для сортируемого элемента
const SortableImageItem: React.FC<{
  image: GalleryImage;
  index: number;
  onDelete: () => void;
  onCaptionChange: (caption: string) => void;
}> = ({ image, index, onDelete, onCaptionChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image._tempId || image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const apiBaseUrl = 'https://api-rejuvena.duckdns.org';
  const imageUrl = image.url.startsWith('http') ? image.url : `${apiBaseUrl}${image.url}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing flex items-center justify-center w-10"
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Превью изображения */}
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={image.caption || `Фото ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Поля */}
        <div className="flex-1 flex flex-col gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подпись (необязательно)
            </label>
            <input
              type="text"
              value={image.caption || ''}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Введите подпись к фото"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            Порядок: {index + 1}
          </div>
        </div>

        {/* Кнопка удаления */}
        <button
          onClick={onDelete}
          className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors"
          title="Удалить"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const GalleryEditor: React.FC<GalleryEditorProps> = ({ images, onChange, sectionTitle = "Галерея" }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = images.findIndex((img) => (img._tempId || img.url) === active.id);
      const newIndex = images.findIndex((img) => (img._tempId || img.url) === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        order: idx,
      }));

      onChange(newImages);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Загружаем все файлы параллельно
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await axios.post(
            'https://api-rejuvena.duckdns.org/api/media/upload',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
              },
            }
          );

          console.log('Upload response:', response.data);

          if (response.data.success && response.data.url) {
            return {
              url: response.data.url,
              caption: '',
              order: 0, // Will be recalculated after all uploads
              _tempId: `temp-${Date.now()}-${Math.random()}`,
            } as GalleryImage;
          } else {
            console.error('Upload failed:', response.data);
            return null;
          }
        } catch (uploadError: any) {
          console.error('Upload error for file:', file.name, uploadError.response?.data || uploadError.message);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((img): img is GalleryImage => img !== null);

      if (successfulUploads.length === 0) {
        throw new Error('Не удалось загрузить ни одного файла');
      }

      // Recalculate order for new images
      const newImages = successfulUploads.map((img, idx) => ({
        ...img,
        order: images.length + idx,
      }));

      onChange([...images, ...newImages]);

      if (successfulUploads.length < files.length) {
        alert(`Загружено ${successfulUploads.length} из ${files.length} файлов. Некоторые файлы не удалось загрузить.`);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки файлов:', error);
      alert(`Ошибка при загрузке файлов: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index).map((img, idx) => ({
      ...img,
      order: idx,
    }));
    onChange(newImages);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{sectionTitle}</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {uploading ? 'Загрузка...' : 'Добавить фото'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 mb-2">Нет загруженных фотографий</p>
          <p className="text-sm text-gray-500">Нажмите "Добавить фото" чтобы начать</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img._tempId || img.url)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {images.map((image, index) => (
                <SortableImageItem
                  key={image._tempId || image.url}
                  image={image}
                  index={index}
                  onDelete={() => handleDelete(index)}
                  onCaptionChange={(caption) => handleCaptionChange(index, caption)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length > 0 && (
        <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          💡 <strong>Совет:</strong> Перетаскивайте фото за иконку ≡ чтобы изменить порядок отображения в галерее
        </div>
      )}
    </div>
  );
};

export default GalleryEditor;
