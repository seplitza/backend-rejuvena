import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDropzone } from 'react-dropzone';
import api from '../api/client';
import TipTapEditor from '../components/TipTapEditor';

import type { DragEndEvent } from '@dnd-kit/core';

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface Media {
  _id?: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  order: number;
}

export default function ExerciseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [carouselMedia, setCarouselMedia] = useState<Media[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    loadTags();
    if (id) {
      loadExercise();
    }
  }, [id]);

  const loadTags = async () => {
    try {
      const response = await api.get('/tags');
      setAvailableTags(response.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadExercise = async () => {
    try {
      const response = await api.get(`/exercises/${id}`);
      const exercise = response.data;
      setTitle(exercise.title);
      setDescription(exercise.description);
      setContent(exercise.content);
      setIsPublished(exercise.isPublished);
      setCarouselMedia(exercise.carouselMedia || []);
      setSelectedTags(exercise.tags.map((t: any) => t._id));
    } catch (error) {
      console.error('Failed to load exercise:', error);
      alert('Ошибка загрузки упражнения');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Заполните название и описание');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title,
        description,
        content,
        isPublished,
        carouselMedia,
        tags: selectedTags
      };

      if (id) {
        await api.put(`/exercises/${id}`, data);
        alert('Упражнение обновлено!');
      } else {
        await api.post('/exercises', data);
        alert('Упражнение создано!');
        navigate('/exercises');
      }
    } catch (error) {
      console.error('Failed to save exercise:', error);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setUploadProgress(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const media: Media = {
          ...response.data,
          order: carouselMedia.length
        };
        setCarouselMedia([...carouselMedia, media]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!mediaUrl.trim()) return;

    setUploadProgress(true);
    try {
      const response = await api.post('/media/upload-url', { url: mediaUrl });
      const media: Media = {
        ...response.data,
        order: carouselMedia.length
      };
      setCarouselMedia([...carouselMedia, media]);
      setMediaUrl('');
    } catch (error) {
      console.error('Upload from URL failed:', error);
      alert('Ошибка загрузки по ссылке');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleMediaDelete = (index: number) => {
    setCarouselMedia(carouselMedia.filter((_, i) => i !== index));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = carouselMedia.findIndex((_, i) => `media-${i}` === active.id);
      const newIndex = carouselMedia.findIndex((_, i) => `media-${i}` === over.id);

      const reordered = arrayMove(carouselMedia, oldIndex, newIndex);
      setCarouselMedia(reordered.map((item, index) => ({ ...item, order: index })));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi']
    }
  });

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await api.post('/tags', { 
        name: newTagName,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      });
      setAvailableTags([...availableTags, response.data]);
      setNewTagName('');
      alert('Тег создан!');
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Ошибка создания тега');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
          {id ? 'Редактировать упражнение' : 'Создать упражнение'}
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/exercises')}
            style={{
              padding: '12px 24px',
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? '#9CA3AF' : '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* Basic Info */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
            placeholder="Название упражнения"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Краткое описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
            placeholder="Краткое описание упражнения для списка"
          />
        </div>

        {/* Content Editor */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Содержимое</label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        {/* Carousel Media */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Карусель изображений</h3>
          
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              background: isDragActive ? '#F3F4F6' : 'white',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            <input {...getInputProps()} />
            <p style={{ color: '#6B7280' }}>
              {uploadProgress ? 'Загрузка...' : 'Перетащите файлы сюда или кликните для выбора'}
            </p>
          </div>

          {/* URL Upload */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Или вставьте URL изображения"
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px'
              }}
            />
            <button
              onClick={handleUrlUpload}
              disabled={uploadProgress || !mediaUrl.trim()}
              style={{
                padding: '12px 24px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Добавить
            </button>
          </div>

          {/* Media List with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={carouselMedia.map((_, i) => `media-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: 'grid', gap: '12px' }}>
                {carouselMedia.map((media, index) => (
                  <SortableMediaItem
                    key={`media-${index}`}
                    id={`media-${index}`}
                    media={media}
                    onDelete={() => handleMediaDelete(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Теги {selectedTags.length > 0 && <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: 'normal' }}>({selectedTags.length} выбрано)</span>}
          </h3>
          
          {/* Create New Tag */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
              placeholder="Создать новый тег"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              style={{
                padding: '8px 16px',
                background: newTagName.trim() ? '#10B981' : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: newTagName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Создать
            </button>
          </div>

          {/* Tag Selection */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableTags.map(tag => {
              const isSelected = selectedTags.includes(tag._id);
              return (
                <button
                  key={tag._id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTags(selectedTags.filter(t => t !== tag._id));
                    } else {
                      setSelectedTags([...selectedTags, tag._id]);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    border: isSelected ? 'none' : `2px solid ${tag.color}`,
                    background: isSelected ? tag.color : 'white',
                    color: isSelected ? 'white' : tag.color,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isSelected ? '600' : '500',
                    transition: 'all 0.2s',
                    position: 'relative',
                    paddingRight: isSelected ? '32px' : '16px'
                  }}
                  title={isSelected ? 'Нажмите, чтобы убрать' : 'Нажмите, чтобы добавить'}
                >
                  {tag.name}
                  {isSelected && (
                    <span style={{ 
                      position: 'absolute', 
                      right: '8px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      fontSize: '16px'
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="published" style={{ cursor: 'pointer', fontWeight: '500' }}>
            Опубликовать упражнение
          </label>
        </div>
      </div>
    </div>
  );
}

// Sortable Media Item Component
interface SortableMediaItemProps {
  id: string;
  media: Media;
  onDelete: () => void;
}

function SortableMediaItem({ id, media, onDelete }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: '#F9FAFB',
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}
    >
      <span {...attributes} {...listeners} style={{ cursor: 'grab', fontSize: '20px' }}>☰</span>
      {media.type === 'image' ? (
        <img src={media.url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
      ) : (
        <video 
          src={media.url} 
          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', background: '#000' }}
          muted
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{media.filename}</div>
        <a 
          href={media.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            fontSize: '12px', 
            color: '#4F46E5', 
            textDecoration: 'underline',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {media.url}
        </a>
        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
          {media.type}
        </div>
      </div>
      <button
        onClick={onDelete}
        style={{
          padding: '8px 16px',
          background: '#DC2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        Удалить
      </button>
    </div>
  );
}
