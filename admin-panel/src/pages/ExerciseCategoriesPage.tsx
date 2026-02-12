import { useState, useEffect } from 'react';
import api from '../api/client';

interface ExerciseCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  isActive: boolean;
}

export default function ExerciseCategoriesPage() {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('💪');
  const [formOrder, setFormOrder] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/exercise-categories/admin/all');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      alert('Заполните название и slug');
      return;
    }

    try {
      await api.post('/exercise-categories/admin/create', {
        name: formName,
        slug: formSlug,
        icon: formIcon,
        order: formOrder
      });
      alert('Категория создана!');
      setShowCreateForm(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Ошибка создания категории');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formName.trim() || !formSlug.trim()) {
      alert('Заполните название и slug');
      return;
    }

    try {
      await api.put(`/exercise-categories/admin/${id}`, {
        name: formName,
        slug: formSlug,
        icon: formIcon,
        order: formOrder
      });
      alert('Категория обновлена!');
      setEditingId(null);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Ошибка обновления категории');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить категорию? Это может повлиять на дни марафонов, где она используется.')) {
      return;
    }

    try {
      await api.delete(`/exercise-categories/admin/${id}`);
      alert('Категория удалена!');
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Ошибка удаления категории');
    }
  };

  const startEdit = (category: ExerciseCategory) => {
    setEditingId(category._id);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormIcon(category.icon);
    setFormOrder(category.order);
  };

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormIcon('💪');
    setFormOrder(0);
    setEditingId(null);
    setShowCreateForm(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
          'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return map[char] || char;
      })
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Категории упражнений</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Создать категорию
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Новая категория</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Название *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setFormSlug(generateSlug(e.target.value));
              }}
              placeholder="Например: Массаж"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Slug (URL) *</label>
            <input
              type="text"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder="massage"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Иконка (emoji)</label>
              <input
                type="text"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="💪"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Порядок</label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCreate}
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
              Создать
            </button>
            <button
              onClick={resetForm}
              style={{
                padding: '8px 20px',
                background: '#F3F4F6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {categories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
            Нет категорий. Создайте первую!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Иконка</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Название</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Slug</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>Порядок</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>Активна</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {editingId === category._id ? (
                    <>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="text"
                          value={formIcon}
                          onChange={(e) => setFormIcon(e.target.value)}
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="text"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="number"
                          value={formOrder}
                          onChange={(e) => setFormOrder(Number(e.target.value))}
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {category.isActive ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleUpdate(category._id)}
                            style={{
                              padding: '4px 12px',
                              background: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={resetForm}
                            style={{
                              padding: '4px 12px',
                              background: '#F3F4F6',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Отмена
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', fontSize: '24px' }}>{category.icon}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{category.name}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '14px' }}>{category.slug}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280' }}>{category.order}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {category.isActive ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => startEdit(category)}
                            style={{
                              padding: '4px 12px',
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            style={{
                              padding: '4px 12px',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
