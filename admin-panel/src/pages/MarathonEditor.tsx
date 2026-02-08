import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api/client';
import TipTapEditor from '../components/TipTapEditor';

import type { DragEndEvent } from '@dnd-kit/core';

interface Exercise {
  _id: string;
  title: string;
}

interface MarathonDay {
  _id?: string;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string;
  exercises: string[]; // Exercise IDs
  order: number;
}

export default function MarathonEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Tab 1: Информация
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(44);
  const [tenure, setTenure] = useState(44);
  const [cost, setCost] = useState(0);
  const [oldPrice, setOldPrice] = useState<number | undefined>(undefined);
  const [isPaid, setIsPaid] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isDisplay, setIsDisplay] = useState(false);
  const [language, setLanguage] = useState('ru');

  // Tab 2: Описание курса
  const [courseDescription, setCourseDescription] = useState('');

  // Tab 3: Правила и Welcome Message
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [rules, setRules] = useState('');
  const [telegramGroupUrl, setTelegramGroupUrl] = useState('');

  // Tab 4: Упражнения
  const [marathonDays, setMarathonDays] = useState<MarathonDay[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  // Tab 5: Фото дневник
  const [photoDiaryEnabled, setPhotoDiaryEnabled] = useState(false);
  const [photoDiaryStartDay, setPhotoDiaryStartDay] = useState(1);
  const [photoDiaryFrequency, setPhotoDiaryFrequency] = useState(7);

  // Tab 6: Конкурс
  const [hasContest, setHasContest] = useState(false);
  const [contestStartDate, setContestStartDate] = useState('');
  const [contestEndDate, setContestEndDate] = useState('');
  const [votingStartDate, setVotingStartDate] = useState('');
  const [votingEndDate, setVotingEndDate] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadExercises();
    if (id) {
      loadMarathon();
      loadMarathonDays();
    }
  }, [id]);

  const loadExercises = async () => {
    try {
      const response = await api.get('/exercises');
      setAvailableExercises(response.data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const loadMarathon = async () => {
    try {
      const response = await api.get(`/marathons/${id}`);
      const m = response.data.marathon; // FIX: API returns { success: true, marathon: {...} }
      
      setTitle(m.title);
      setStartDate(m.startDate.split('T')[0]);
      setNumberOfDays(m.numberOfDays);
      setTenure(m.tenure);
      setCost(m.cost);
      setOldPrice(m.oldPrice);
      setIsPaid(m.isPaid);
      setIsPublic(m.isPublic);
      setIsDisplay(m.isDisplay);
      setLanguage(m.language);
      setCourseDescription(m.courseDescription || '');
      setWelcomeMessage(m.welcomeMessage || '');
      setRules(m.rules || '');
      setTelegramGroupUrl(m.telegramGroupUrl || '');
      setHasContest(m.hasContest);
      setContestStartDate(m.contestStartDate ? m.contestStartDate.split('T')[0] : '');
      setContestEndDate(m.contestEndDate ? m.contestEndDate.split('T')[0] : '');
      setVotingStartDate(m.votingStartDate ? m.votingStartDate.split('T')[0] : '');
      setVotingEndDate(m.votingEndDate ? m.votingEndDate.split('T')[0] : '');
    } catch (error) {
      console.error('Failed to load marathon:', error);
      alert('Ошибка загрузки марафона');
    } finally {
      setLoading(false);
    }
  };

  const loadMarathonDays = async () => {
    try {
      const response = await api.get(`/marathons/${id}/days`);
      setMarathonDays(response.data.sort((a: MarathonDay, b: MarathonDay) => a.dayNumber - b.dayNumber));
    } catch (error) {
      console.error('Failed to load marathon days:', error);
    }
  };

  const handleSaveInfo = async () => {
    if (!title.trim() || !startDate) {
      alert('Заполните название и дату старта');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title,
        startDate: new Date(startDate).toISOString(),
        numberOfDays,
        tenure,
        cost,
        oldPrice,
        isPaid,
        isPublic,
        isDisplay,
        language,
        courseDescription,
        welcomeMessage,
        rules,
        telegramGroupUrl,
        hasContest,
        contestStartDate: contestStartDate ? new Date(contestStartDate).toISOString() : undefined,
        contestEndDate: contestEndDate ? new Date(contestEndDate).toISOString() : undefined,
        votingStartDate: votingStartDate ? new Date(votingStartDate).toISOString() : undefined,
        votingEndDate: votingEndDate ? new Date(votingEndDate).toISOString() : undefined
      };

      if (id) {
        await api.put(`/marathons/admin/${id}`, data);
        alert('Марафон обновлён!');
      } else {
        const response = await api.post('/marathons/admin/create', data);
        alert('Марафон создан!');
        navigate(`/marathons/${response.data._id}`);
      }
    } catch (error) {
      console.error('Failed to save marathon:', error);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDay = async () => {
    if (!id) {
      alert('Сначала сохраните марафон');
      return;
    }

    const newDayNumber = marathonDays.length + 1;
    try {
      await api.post(`/marathons/admin/${id}/days`, {
        dayNumber: newDayNumber,
        dayType: 'learning',
        description: '',
        exercises: [],
        order: newDayNumber
      });
      await loadMarathonDays();
    } catch (error) {
      console.error('Failed to add day:', error);
      alert('Ошибка добавления дня');
    }
  };

  const handleUpdateDay = async (dayId: string, updates: Partial<MarathonDay>) => {
    try {
      await api.put(`/marathons/admin/${id}/days/${dayId}`, updates);
      await loadMarathonDays();
    } catch (error) {
      console.error('Failed to update day:', error);
      alert('Ошибка обновления дня');
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Удалить этот день?')) return;

    try {
      await api.delete(`/marathons/admin/${id}/days/${dayId}`);
      await loadMarathonDays();
    } catch (error) {
      console.error('Failed to delete day:', error);
      alert('Ошибка удаления дня');
    }
  };

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = marathonDays.findIndex(d => d._id === active.id);
    const newIndex = marathonDays.findIndex(d => d._id === over.id);

    const reordered = arrayMove(marathonDays, oldIndex, newIndex);
    setMarathonDays(reordered);

    // Обновляем dayNumber для каждого дня
    reordered.forEach(async (day, index) => {
      if (day._id && day.dayNumber !== index + 1) {
        await handleUpdateDay(day._id, { dayNumber: index + 1, order: index + 1 });
      }
    });
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  const tabs = [
    { id: 0, label: '📝 Информация' },
    { id: 1, label: '📖 Описание курса' },
    { id: 2, label: '📋 Правила и приветствие' },
    { id: 3, label: '💪 Упражнения' },
    { id: 4, label: '📸 Фото дневник' },
    { id: 5, label: '🏆 Конкурс' }
  ];

  return (
    <div style={{ padding: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
          {id ? `Редактирование: ${title || 'Марафон'}` : 'Создать марафон'}
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/marathons')}
            style={{
              padding: '10px 20px',
              background: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSaveInfo}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #E5E7EB', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
                color: activeTab === tab.id ? '#4F46E5' : '#6B7280',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
                fontSize: '14px',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* Tab 1: Информация */}
        {activeTab === 0 && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Основная информация</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Название марафона *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Омолодись за 44 дня"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Дата старта *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Язык
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Количество дней в марафоне
                </label>
                <input
                  type="number"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(Number(e.target.value))}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Общая продолжительность (дни)
                </label>
                <input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500', color: '#374151' }}>Платный марафон</span>
              </label>
            </div>

            {isPaid && (
              <div style={{ marginBottom: '20px', marginLeft: '26px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Стоимость (₽)
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  min="0"
                  style={{
                    width: '200px',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {isPaid && (
              <div style={{ marginBottom: '20px', marginLeft: '26px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Старая цена (₽) - необязательно
                </label>
                <input
                  type="number"
                  value={oldPrice || ''}
                  onChange={(e) => setOldPrice(e.target.value ? Number(e.target.value) : undefined)}
                  min="0"
                  placeholder="Например, 4500"
                  style={{
                    width: '200px',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#6B7280' }}>
                  Будет показана перечеркнутой на лендинге
                </div>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500', color: '#374151' }}>Публичный (виден всем)</span>
              </label>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDisplay}
                  onChange={(e) => setIsDisplay(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500', color: '#374151' }}>Показывать на витрине</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Описание курса */}
        {activeTab === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Описание курса</h2>
            <TipTapEditor
              content={courseDescription}
              onChange={setCourseDescription}
            />
          </div>
        )}

        {/* Tab 3: Правила и Welcome Message */}
        {activeTab === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Приветственное сообщение</h2>
            <TipTapEditor
              content={welcomeMessage}
              onChange={setWelcomeMessage}
            />

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '40px', marginBottom: '24px' }}>Правила марафона</h2>
            <TipTapEditor
              content={rules}
              onChange={setRules}
            />

            <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '40px', marginBottom: '16px' }}>Ссылка на группу Telegram</h2>
            <input
              type="url"
              value={telegramGroupUrl}
              onChange={(e) => setTelegramGroupUrl(e.target.value)}
              placeholder="https://t.me/your_group"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
              Ссылка будет показана после успешной оплаты и в email-уведомлениях
            </p>
          </div>
        )}

        {/* Tab 4: Упражнения */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Дни марафона</h2>
              <button
                onClick={handleAddDay}
                disabled={!id}
                style={{
                  padding: '8px 16px',
                  background: id ? '#4F46E5' : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: id ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                + Добавить день
              </button>
            </div>

            {!id && (
              <div style={{ padding: '20px', background: '#FEF3C7', borderRadius: '8px', marginBottom: '20px' }}>
                ℹ️ Сначала сохраните марафон, чтобы добавить дни с упражнениями
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDayDragEnd}
            >
              <SortableContext
                items={marathonDays.map(d => d._id || '')}
                strategy={verticalListSortingStrategy}
              >
                {marathonDays.map((day) => (
                  <DayItem
                    key={day._id}
                    day={day}
                    availableExercises={availableExercises}
                    onUpdate={handleUpdateDay}
                    onDelete={handleDeleteDay}
                    isEditing={editingDay === day.dayNumber}
                    onEditToggle={() => setEditingDay(editingDay === day.dayNumber ? null : day.dayNumber)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {marathonDays.length === 0 && id && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                Нет дней. Добавьте первый день!
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Фото дневник */}
        {activeTab === 4 && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Настройки фото дневника</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={photoDiaryEnabled}
                  onChange={(e) => setPhotoDiaryEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500', color: '#374151' }}>Включить фото дневник</span>
              </label>
            </div>

            {photoDiaryEnabled && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Начать с дня
                  </label>
                  <input
                    type="number"
                    value={photoDiaryStartDay}
                    onChange={(e) => setPhotoDiaryStartDay(Number(e.target.value))}
                    min="1"
                    style={{
                      width: '200px',
                      padding: '10px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Частота (каждые N дней)
                  </label>
                  <input
                    type="number"
                    value={photoDiaryFrequency}
                    onChange={(e) => setPhotoDiaryFrequency(Number(e.target.value))}
                    min="1"
                    style={{
                      width: '200px',
                      padding: '10px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ padding: '16px', background: '#EEF2FF', borderRadius: '8px', marginTop: '24px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#4F46E5' }}>
                💡 Фото дневник позволяет участникам загружать фотографии для отслеживания прогресса
              </p>
            </div>
          </div>
        )}

        {/* Tab 6: Конкурс */}
        {activeTab === 5 && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Настройки конкурса</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasContest}
                  onChange={(e) => setHasContest(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500', color: '#374151' }}>Включить конкурс</span>
              </label>
            </div>

            {hasContest && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Начало конкурса
                    </label>
                    <input
                      type="date"
                      value={contestStartDate}
                      onChange={(e) => setContestStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Окончание конкурса
                    </label>
                    <input
                      type="date"
                      value={contestEndDate}
                      onChange={(e) => setContestEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Начало голосования
                    </label>
                    <input
                      type="date"
                      value={votingStartDate}
                      onChange={(e) => setVotingStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Окончание голосования
                    </label>
                    <input
                      type="date"
                      value={votingEndDate}
                      onChange={(e) => setVotingEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '8px', marginTop: '24px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>
                🏆 Конкурс позволяет участникам соревноваться и голосовать за лучшие результаты
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Day Item Component
interface DayItemProps {
  day: MarathonDay;
  availableExercises: Exercise[];
  onUpdate: (dayId: string, updates: Partial<MarathonDay>) => void;
  onDelete: (dayId: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

function DayItem({ day, availableExercises, onUpdate, onDelete, isEditing, onEditToggle }: DayItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: day._id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [localDescription, setLocalDescription] = useState(day.description);
  const [localDayType, setLocalDayType] = useState(day.dayType);
  const [localExercises, setLocalExercises] = useState<string[]>(day.exercises);

  const handleSave = () => {
    if (day._id) {
      onUpdate(day._id, {
        description: localDescription,
        dayType: localDayType,
        exercises: localExercises
      });
    }
    onEditToggle();
  };

  const toggleExercise = (exerciseId: string) => {
    if (localExercises.includes(exerciseId)) {
      setLocalExercises(localExercises.filter(id => id !== exerciseId));
    } else {
      setLocalExercises([...localExercises, exerciseId]);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        marginBottom: '16px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        background: 'white',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F9FAFB'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              padding: '4px 8px',
              background: '#E5E7EB',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            ⋮⋮
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>День {day.dayNumber}</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
              {day.dayType === 'learning' ? '📚 Обучение' : '🏋️ Практика'} • {day.exercises.length} упражнений
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEditToggle}
            style={{
              padding: '6px 12px',
              background: isEditing ? '#4F46E5' : '#EEF2FF',
              color: isEditing ? 'white' : '#4F46E5',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            {isEditing ? 'Закрыть' : 'Редактировать'}
          </button>
          <button
            onClick={() => day._id && onDelete(day._id)}
            style={{
              padding: '6px 12px',
              background: '#FEE2E2',
              color: '#DC2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            Удалить
          </button>
        </div>
      </div>

      {isEditing && (
        <div style={{ padding: '20px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Тип дня
            </label>
            <select
              value={localDayType}
              onChange={(e) => setLocalDayType(e.target.value as 'learning' | 'practice')}
              style={{
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="learning">📚 Обучение</option>
              <option value="practice">🏋️ Практика</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Описание дня
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              placeholder="Краткое описание дня..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Упражнения ({localExercises.length} выбрано)
            </label>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '8px'
            }}>
              {availableExercises.map(exercise => (
                <label
                  key={exercise._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    background: localExercises.includes(exercise._id) ? '#EEF2FF' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={localExercises.includes(exercise._id)}
                    onChange={() => toggleExercise(exercise._id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px' }}>{exercise.title}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Сохранить день
          </button>
        </div>
      )}
    </div>
  );
}
