import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api/client';
import TipTapEditor from '../components/TipTapEditor';
import DayNavigation from '../components/DayNavigation';

import type { DragEndEvent } from '@dnd-kit/core';

interface Exercise {
  _id: string;
  title: string;
}

interface ExerciseCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
}

interface ExerciseGroup {
  categoryId: string;
  categoryName?: string;
  exerciseIds: string[];
}

interface MarathonDay {
  _id?: string;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string;
  exerciseGroups: ExerciseGroup[];
  exercises: string[]; // For backward compatibility
  newExerciseIds?: string[]; // Новые упражнения в этом дне (подсветка зеленым)
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
  const [paymentDescription, setPaymentDescription] = useState('');
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
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const daysContainerRef = useRef<HTMLDivElement>(null);
  const dayItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const scrollToDay = (dayNumber: number) => {
    const el = dayItemRefs.current.get(dayNumber);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const response = await api.get('/exercise-categories');
      setExerciseCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadMarathon = async () => {
    try {
      const response = await api.get(`/marathons/${id}`);
      const m = response.data.marathon; // FIX: API returns { success: true, marathon: {...} }
      
      setTitle(m.title);
      setPaymentDescription(m.paymentDescription || '');
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
      const days = response.data.days || response.data || [];
      setMarathonDays(days.sort((a: MarathonDay, b: MarathonDay) => a.dayNumber - b.dayNumber));
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
        paymentDescription,
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
      // API автоматически скопирует exerciseGroups из предыдущего дня
      await api.post(`/marathons/admin/${id}/days`, {
        dayNumber: newDayNumber,
        dayType: 'learning',
        description: '', // Описание не копируется - редактор заполняет сам
        exerciseGroups: [], // API заполнит из предыдущего дня
        exercises: [], // For backward compatibility
        order: newDayNumber
      });
      await loadMarathonDays();
      
      // Если создан не первый день - показываем подсказку
      if (newDayNumber > 1) {
        alert(`День ${newDayNumber} создан как копия дня ${newDayNumber - 1}.\nНовые упражнения будут подсвечены зеленым во фронтенде.`);
      }
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Описание в чеке оплаты
              </label>
              <input
                type="text"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="Доступ к фото и видео материалам марафона Сеплица"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <p style={{ marginTop: '6px', fontSize: '13px', color: '#6B7280' }}>
                Если пусто, будет использовано: "Доступ к фото и видео материалам марафона Сеплица [название]"
              </p>
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

            <div ref={daysContainerRef}>
              {marathonDays.length > 0 && (
                <DayNavigation
                  marathonDays={marathonDays}
                  numberOfDays={numberOfDays}
                  startDate={startDate}
                  onDayClick={scrollToDay}
                />
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
                    <div
                      key={day._id}
                      ref={(el) => {
                        if (el) dayItemRefs.current.set(day.dayNumber, el);
                        else dayItemRefs.current.delete(day.dayNumber);
                      }}
                    >
                      <DayItem
                        day={day}
                        availableExercises={availableExercises}
                        exerciseCategories={exerciseCategories}
                        onUpdate={handleUpdateDay}
                        onDelete={handleDeleteDay}
                        isEditing={editingDay === day.dayNumber}
                        onEditToggle={() => setEditingDay(editingDay === day.dayNumber ? null : day.dayNumber)}
                      />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>

              {marathonDays.length === 0 && id && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  Нет дней. Добавьте первый день!
                </div>
              )}
            </div>
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

// Sortable Exercise Row Component (для drag-and-drop внутри категории)
interface SortableExerciseRowProps {
  exerciseId: string;
  exercise: Exercise;
  idx: number;
  isNew: boolean;
  onRemove: () => void;
}

function SortableExerciseRow({ exerciseId, exercise, idx, isNew, onRemove }: SortableExerciseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exerciseId });

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
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: isNew ? '#DCFCE7' : 'white',
        borderRadius: '6px',
        border: isNew ? '1px solid #86EFAC' : '1px solid #E5E7EB'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            padding: '2px',
            color: '#9CA3AF',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ⋮⋮
        </div>
        <span style={{ 
          color: '#6B7280', 
          fontSize: '13px',
          fontWeight: '600',
          minWidth: '24px'
        }}>
          {idx + 1}.
        </span>
        <span style={{ fontSize: '14px' }}>{exercise.title}</span>
        {isNew && (
          <span style={{
            padding: '2px 6px',
            background: '#22C55E',
            color: 'white',
            fontSize: '10px',
            fontWeight: '600',
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}>
            Новое
          </span>
        )}
      </div>
      <button
        onClick={onRemove}
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
        ✕
      </button>
    </div>
  );
}

// Sortable Day Item Component
interface DayItemProps {
  day: MarathonDay;
  availableExercises: Exercise[];
  exerciseCategories: ExerciseCategory[];
  onUpdate: (dayId: string, updates: Partial<MarathonDay>) => void;
  onDelete: (dayId: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

function DayItem({ day, availableExercises, exerciseCategories, onUpdate, onDelete, isEditing, onEditToggle }: DayItemProps) {
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
  const [localExerciseGroups, setLocalExerciseGroups] = useState<ExerciseGroup[]>(() => {
    // Нормализуем при начальной инициализации
    return (day.exerciseGroups || []).map(group => ({
      categoryId: typeof group.categoryId === 'string' 
        ? group.categoryId 
        : (group.categoryId as any)?._id || group.categoryId,
      categoryName: group.categoryName,
      exerciseIds: group.exerciseIds.map(id => 
        typeof id === 'string' ? id : (id as any)._id
      )
    }));
  });

  // Синхронизируем локальный state с props при изменении дня
  useEffect(() => {
    // Нормализуем exerciseGroups (MongoDB может вернуть populated объекты)
    const normalizedGroups = (day.exerciseGroups || []).map(group => ({
      categoryId: typeof group.categoryId === 'string' 
        ? group.categoryId 
        : (group.categoryId as any)?._id || group.categoryId,
      categoryName: group.categoryName,
      exerciseIds: group.exerciseIds.map(id => 
        typeof id === 'string' ? id : (id as any)._id
      )
    }));
    
    setLocalDescription(day.description);
    setLocalDayType(day.dayType);
    setLocalExerciseGroups(normalizedGroups);
  }, [day.description, day.dayType, day.exerciseGroups, day._id]);

  // Sensors для drag-and-drop упражнений
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSave = () => {
    if (day._id) {
      // Также обновляем exercises для backward compatibility
      const allExercises = localExerciseGroups.flatMap(g => g.exerciseIds);
      onUpdate(day._id, {
        description: localDescription,
        dayType: localDayType,
        exerciseGroups: localExerciseGroups,
        exercises: allExercises
      });
    }
    onEditToggle();
  };

  const addExerciseGroup = () => {
    if (exerciseCategories.length === 0) {
      alert('Сначала создайте категории упражнений');
      return;
    }
    setLocalExerciseGroups([
      ...localExerciseGroups,
      {
        categoryId: exerciseCategories[0]._id,
        categoryName: exerciseCategories[0].name,
        exerciseIds: []
      }
    ]);
  };

  const removeExerciseGroup = (index: number) => {
    setLocalExerciseGroups(localExerciseGroups.filter((_, i) => i !== index));
  };

  const updateGroupCategory = (index: number, categoryId: string) => {
    const category = exerciseCategories.find(c => c._id === categoryId);
    const updated = [...localExerciseGroups];
    updated[index] = {
      ...updated[index],
      categoryId,
      categoryName: category?.name
    };
    setLocalExerciseGroups(updated);
  };

  const addExerciseToGroup = (groupIndex: number, exerciseId: string) => {
    if (!exerciseId) return;
    
    const updated = [...localExerciseGroups];
    const group = updated[groupIndex];
    
    if (!group.exerciseIds.includes(exerciseId)) {
      group.exerciseIds = [...group.exerciseIds, exerciseId];
      setLocalExerciseGroups(updated);
    }
  };

  const removeExerciseFromGroup = (groupIndex: number, exerciseId: string) => {
    const updated = [...localExerciseGroups];
    const group = updated[groupIndex];
    group.exerciseIds = group.exerciseIds.filter(id => id !== exerciseId);
    setLocalExerciseGroups(updated);
  };

  const handleExerciseDragEnd = (groupIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const updated = [...localExerciseGroups];
    const group = updated[groupIndex];
    const oldIndex = group.exerciseIds.indexOf(active.id as string);
    const newIndex = group.exerciseIds.indexOf(over.id as string);
    
    group.exerciseIds = arrayMove(group.exerciseIds, oldIndex, newIndex);
    setLocalExerciseGroups(updated);
  };

  const getTotalExercises = () => {
    return localExerciseGroups.reduce((sum, group) => sum + group.exerciseIds.length, 0);
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
              {day.dayType === 'learning' ? '📚 Обучение' : '🏋️ Практика'} • {getTotalExercises()} упражнений
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
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
            {isEditing ? 'Сохранить' : 'Редактировать'}
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

      {/* Свернутый вид: показываем список упражнений */}
      {!isEditing && (
        <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB' }}>
          {day.exerciseGroups.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center' }}>
              Нет упражнений
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {day.exerciseGroups.map((group, groupIndex) => {
                // Нормализуем ID
                const categoryIdStr = typeof group.categoryId === 'string' 
                  ? group.categoryId 
                  : (group.categoryId as any)?._id || group.categoryId;
                
                const category = exerciseCategories.find(c => c._id === categoryIdStr);
                
                return (
                  <div key={groupIndex}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      <span style={{ fontSize: '20px' }}>{category?.icon || '💪'}</span>
                      <span>{category?.name || 'Без категории'}</span>
                      <span style={{ color: '#9CA3AF', fontWeight: '400' }}>({group.exerciseIds.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '28px' }}>
                      {group.exerciseIds.map((exerciseId, idx) => {
                        // Нормализуем exerciseId
                        const exIdStr = typeof exerciseId === 'string' ? exerciseId : (exerciseId as any)?._id;
                        const exercise = availableExercises.find(e => e._id === exIdStr);
                        if (!exercise) return null;
                        
                        const isNew = day.dayNumber > 1 && 
                                     day.newExerciseIds && 
                                     day.newExerciseIds.includes(exIdStr);
                        
                        return (
                          <div 
                            key={exIdStr}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#6B7280',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: isNew ? '#DCFCE7' : '#F9FAFB'
                            }}
                          >
                            <span style={{ fontWeight: '600', minWidth: '20px' }}>{idx + 1}.</span>
                            <span>{exercise.title}</span>
                            {isNew && (
                              <span style={{
                                padding: '2px 4px',
                                background: '#22C55E',
                                color: 'white',
                                fontSize: '9px',
                                fontWeight: '600',
                                borderRadius: '3px'
                              }}>NEW</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Описание дня (План дня)
            </label>
            <TipTapEditor
              content={localDescription}
              onChange={setLocalDescription}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontWeight: '500', fontSize: '14px' }}>
                Упражнения по категориям ({getTotalExercises()} упражнений)
              </label>
              <button
                onClick={addExerciseGroup}
                style={{
                  padding: '6px 12px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                + Добавить категорию
              </button>
            </div>

            {localExerciseGroups.length === 0 ? (
              <div style={{
                padding: '20px',
                border: '2px dashed #D1D5DB',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6B7280'
              }}>
                Нет категорий упражнений. Нажмите "+ Добавить категорию"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {localExerciseGroups.map((group, groupIndex) => {
                  // MongoDB может вернуть populated объект или просто ID
                  const categoryIdStr = typeof group.categoryId === 'string' 
                    ? group.categoryId 
                    : (group.categoryId as any)?._id || group.categoryId;
                  
                  const category = exerciseCategories.find(c => c._id === categoryIdStr);
                  
                  // exerciseIds могут быть строками или объектами с _id
                  const exerciseIdsArray = group.exerciseIds.map(id => 
                    typeof id === 'string' ? id : (id as any)._id
                  );
                  
                  // Нормализуем group для использования в компоненте
                  const normalizedGroup = {
                    ...group,
                    categoryId: categoryIdStr,
                    exerciseIds: exerciseIdsArray
                  };
                  
                  return (
                    <div
                      key={groupIndex}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        background: '#F9FAFB'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <span style={{ fontSize: '24px' }}>{category?.icon || '💪'}</span>
                          <select
                            value={normalizedGroup.categoryId}
                            onChange={(e) => updateGroupCategory(groupIndex, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            {exerciseCategories.map(cat => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => removeExerciseGroup(groupIndex)}
                          style={{
                            padding: '6px 12px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            marginLeft: '12px'
                          }}
                        >
                          Удалить
                        </button>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        {/* Список выбранных упражнений с drag-and-drop */}
                        {normalizedGroup.exerciseIds.length > 0 && (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleExerciseDragEnd(groupIndex, event)}
                          >
                            <SortableContext
                              items={normalizedGroup.exerciseIds}
                              strategy={verticalListSortingStrategy}
                            >
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '6px',
                                marginBottom: '12px'
                              }}>
                                {normalizedGroup.exerciseIds.map((exerciseId, idx) => {
                                  const exercise = availableExercises.find(e => e._id === exerciseId);
                                  if (!exercise) return null;
                                  
                                  const isNew = !!(day.dayNumber > 1 && 
                                               day.newExerciseIds && 
                                               day.newExerciseIds.includes(exerciseId));
                                  
                                  return <SortableExerciseRow 
                                    key={exerciseId}
                                    exerciseId={exerciseId}
                                    exercise={exercise}
                                    idx={idx}
                                    isNew={isNew}
                                    onRemove={() => removeExerciseFromGroup(groupIndex, exerciseId)}
                                  />;
                                })}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}

                        {/* Поле поиска и добавления упражнения */}
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            list={`exercises-datalist-${groupIndex}`}
                            placeholder="🔍 Начните вводить название упражнения..."
                            onChange={(e) => {
                              const selectedExercise = availableExercises.find(
                                ex => ex.title === e.target.value
                              );
                              if (selectedExercise) {
                                addExerciseToGroup(groupIndex, selectedExercise._id);
                                e.target.value = ''; // Clear input
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const selectedExercise = availableExercises.find(
                                  ex => ex.title === input.value
                                );
                                if (selectedExercise) {
                                  addExerciseToGroup(groupIndex, selectedExercise._id);
                                  input.value = '';
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: 'white'
                            }}
                          />
                          <datalist id={`exercises-datalist-${groupIndex}`}>
                            {availableExercises
                              .filter(ex => !normalizedGroup.exerciseIds.includes(ex._id))
                              .map(exercise => (
                                <option key={exercise._id} value={exercise.title} />
                              ))}
                          </datalist>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
