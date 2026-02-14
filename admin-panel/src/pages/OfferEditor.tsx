/**
 * Offer Editor
 * Create/Edit promotional offers
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

interface Marathon {
  _id: string;
  title: string;
  cost: number;
  isPaid: boolean;
}

interface Exercise {
  _id: string;
  title: string;
  isPremium: boolean;
}

export default function OfferEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  
  // Offer data
  const [type, setType] = useState<'premium' | 'marathon' | 'exercise'>('premium');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('bg-yellow-400 text-yellow-900');
  const [gradientFrom, setGradientFrom] = useState('#9333ea');
  const [gradientTo, setGradientTo] = useState('#ec4899');
  const [borderColor, setBorderColor] = useState('border-purple-200 hover:border-purple-400');
  const [marathonId, setMarathonId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [features, setFeatures] = useState<Array<{ title: string; description: string }>>([]);
  const [price, setPrice] = useState<number | ''>('');
  const [priceLabel, setPriceLabel] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [order, setOrder] = useState(0);
  const [showToLoggedIn, setShowToLoggedIn] = useState(true);
  const [showToGuests, setShowToGuests] = useState(true);
  const [hiddenIfOwned, setHiddenIfOwned] = useState(true);
  const [buttonText, setButtonText] = useState('');
  
  // Reference data
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadReferenceData();
    if (isEditMode) {
      loadOffer();
    }
  }, [id]);

  const loadReferenceData = async () => {
    try {
      const [marathonsRes, exercisesRes] = await Promise.all([
        api.get('/marathons/admin/all'),
        api.get('/exercises/admin/all')
      ]);
      setMarathons(marathonsRes.data.marathons || []);
      setExercises(exercisesRes.data.exercises || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  };

  const loadOffer = async () => {
    try {
      const response = await api.get(`/offers/${id}`);
      const offer = response.data.offer;
      
      setType(offer.type);
      setTitle(offer.title || '');
      setSubtitle(offer.subtitle || '');
      setDescription(offer.description || '');
      setBadge(offer.badge || '');
      setBadgeColor(offer.badgeColor || 'bg-yellow-400 text-yellow-900');
      setGradientFrom(offer.gradient?.from || '#9333ea');
      setGradientTo(offer.gradient?.to || '#ec4899');
      setBorderColor(offer.borderColor || '');
      setMarathonId(offer.marathonId?._id || '');
      setExerciseId(offer.exerciseId?._id || '');
      setFeatures(offer.features || []);
      setPrice(offer.price || '');
      setPriceLabel(offer.priceLabel || '');
      setIsVisible(offer.isVisible);
      setOrder(offer.order || 0);
      setShowToLoggedIn(offer.showToLoggedIn);
      setShowToGuests(offer.showToGuests);
      setHiddenIfOwned(offer.hiddenIfOwned);
      setButtonText(offer.buttonText || '');
    } catch (error) {
      console.error('Failed to load offer:', error);
      alert('Ошибка загрузки предложения');
      navigate('/offers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const offerData = {
        type,
        title,
        subtitle: subtitle || undefined,
        description: description || undefined,
        badge: badge || undefined,
        badgeColor: badgeColor || undefined,
        gradient: { from: gradientFrom, to: gradientTo },
        borderColor: borderColor || undefined,
        marathonId: type === 'marathon' ? marathonId : undefined,
        exerciseId: type === 'exercise' ? exerciseId : undefined,
        features: features.length > 0 ? features : undefined,
        price: price || undefined,
        priceLabel: priceLabel || undefined,
        isVisible,
        order,
        showToLoggedIn,
        showToGuests,
        hiddenIfOwned,
        buttonText: buttonText || undefined,
      };

      if (isEditMode) {
        await api.put(`/offers/${id}`, offerData);
        alert('Предложение обновлено');
      } else {
        await api.post('/offers', offerData);
        alert('Предложение создано');
      }
      
      navigate('/offers');
    } catch (error: any) {
      console.error('Failed to save offer:', error);
      alert(error.response?.data?.error || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setFeatures([...features, { title: '', description: '' }]);
  };

  const updateFeature = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...features];
    updated[index][field] = value;
    setFeatures(updated);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/offers')}
          style={{
            padding: '8px 16px',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          ← Назад к списку
        </button>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
          {isEditMode ? 'Редактировать предложение' : 'Создать предложение'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '32px' }}>
          {/* Type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Тип предложения *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px'
              }}
              required
            >
              <option value="premium">⭐ Premium подписка</option>
              <option value="marathon">🏃 Марафон</option>
              <option value="exercise">💪 Упражнение</option>
            </select>
          </div>

          {/* Marathon Selection */}
          {type === 'marathon' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Марафон *
              </label>
              <select
                value={marathonId}
                onChange={(e) => setMarathonId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Выберите марафон</option>
                {marathons.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.isPaid ? `${m.cost} ₽` : 'Бесплатно'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Exercise Selection */}
          {type === 'exercise' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Упражнение *
              </label>
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Выберите упражнение</option>
                {exercises.map(e => (
                  <option key={e._id} value={e._id}>
                    {e.title} ({e.isPremium ? 'Premium' : 'Бесплатно'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px'
              }}
              placeholder="Премиум доступ"
              required
            />
          </div>

          {/* Subtitle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Подзаголовок
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px'
              }}
              placeholder="Полный доступ ко всем упражнениям"
            />
          </div>

          {/* Badge */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Бейдж
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
                placeholder="⭐ Популярный"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Цвет бейджа
              </label>
              <input
                type="text"
                value={badgeColor}
                onChange={(e) => setBadgeColor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
                placeholder="bg-yellow-400"
              />
            </div>
          </div>

          {/* Gradient Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Градиент От
              </label>
              <input
                type="color"
                value={gradientFrom}
                onChange={(e) => setGradientFrom(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Градиент До
              </label>
              <input
                type="color"
                value={gradientTo}
                onChange={(e) => setGradientTo(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Цена
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
                placeholder="990"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Подпись цены
              </label>
              <input
                type="text"
                value={priceLabel}
                onChange={(e) => setPriceLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px'
                }}
                placeholder="/ месяц"
              />
            </div>
          </div>

          {/* Features (for Premium) */}
          {type === 'premium' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px' }}>
                  Преимущества
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  style={{
                    padding: '6px 12px',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Добавить
                </button>
              </div>
              {features.map((feature, index) => (
                <div key={index} style={{ marginBottom: '12px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}
                    placeholder="Заголовок"
                  />
                  <input
                    type="text"
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}
                    placeholder="Описание"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    style={{
                      padding: '4px 8px',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Order */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Порядок (меньше = выше)
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Checkboxes */}
          <div style={{ marginBottom: '24px', padding: '20px', background: '#F9FAFB', borderRadius: '8px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Показывать в каруселе</span>
              </label>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showToGuests}
                  onChange={(e) => setShowToGuests(e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Показывать гостям</span>
              </label>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showToLoggedIn}
                  onChange={(e) => setShowToLoggedIn(e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Показывать авторизованным</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hiddenIfOwned}
                  onChange={(e) => setHiddenIfOwned(e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Скрывать если уже куплено</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '14px',
                background: saving ? '#9CA3AF' : '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/offers')}
              style={{
                padding: '14px 24px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
