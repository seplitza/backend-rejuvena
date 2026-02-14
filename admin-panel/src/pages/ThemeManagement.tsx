/**
 * Theme Management Page
 * Admin interface for creating and managing application color themes
 */

import { useState, useEffect } from 'react';

interface Theme {
  _id: string;
  name: string;
  slug: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    background: string;
  };
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

const API_URL = window.location.origin;

export default function ThemeManagement() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/themes/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setThemes(data.themes);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      alert('Ошибка загрузки тем');
    } finally {
      setLoading(false);
    }
  };

  const createTheme = () => {
    setIsCreating(true);
    setEditingTheme({
      _id: '',
      name: 'Новая тема',
      slug: 'new-theme',
      isDark: false,
      colors: {
        primary: '#7c3aed',
        secondary: '#ec4899',
        accent: '#f97316',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827',
        textSecondary: '#6b7280',
      },
      gradients: {
        primary: 'from-purple-600 to-pink-600',
        secondary: 'from-orange-500 to-pink-500',
        background: 'from-pink-50 to-purple-50',
      },
      isDefault: false,
      isActive: true,
      order: themes.length + 1,
    });
  };

  const saveTheme = async () => {
    if (!editingTheme) return;

    try {
      const token = localStorage.getItem('authToken');
      const url = isCreating
        ? `${API_URL}/api/themes`
        : `${API_URL}/api/themes/${editingTheme._id}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingTheme),
      });

      const data = await response.json();
      if (data.success) {
        alert('Тема сохранена!');
        setEditingTheme(null);
        setIsCreating(false);
        loadThemes();
      } else {
        alert(data.error || 'Ошибка сохранения темы');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Ошибка сохранения темы');
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm('Удалить эту тему?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/themes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert('Тема удалена');
        loadThemes();
      } else {
        alert(data.error || 'Ошибка удаления темы');
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Ошибка удаления темы');
    }
  };

  const setDefaultTheme = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/themes/${id}/set-default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert('Тема по умолчанию установлена!');
        loadThemes();
      } else {
        alert(data.error || 'Ошибка установки темы по умолчанию');
      }
    } catch (error) {
      console.error('Error setting default theme:', error);
      alert('Ошибка установки темы по умолчанию');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Загрузка тем...</p>
      </div>
    );
  }

  if (editingTheme) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          {isCreating ? 'Создать тему' : 'Редактировать тему'}
        </h1>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>
              Название темы:
            </label>
            <input
              type="text"
              value={editingTheme.name}
              onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={editingTheme.isDark}
                onChange={(e) => setEditingTheme({ ...editingTheme, isDark: e.target.checked })}
              />
              <span>Темная тема</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={editingTheme.isActive}
                onChange={(e) => setEditingTheme({ ...editingTheme, isActive: e.target.checked })}
              />
              <span>Активна</span>
            </label>
          </div>

          {/* Colors */}
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', marginTop: '30px' }}>
            Цвета:
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {Object.entries(editingTheme.colors).map(([key, value]) => (
              <div key={key}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px', textTransform: 'capitalize' }}>
                  {key}:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      setEditingTheme({
                        ...editingTheme,
                        colors: { ...editingTheme.colors, [key]: e.target.value },
                      })
                    }
                    style={{ width: '50px', height: '40px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setEditingTheme({
                        ...editingTheme,
                        colors: { ...editingTheme.colors, [key]: e.target.value },
                      })
                    }
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Gradients */}
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', marginTop: '30px' }}>
            Градиенты (Tailwind классы):
          </h3>

          {Object.entries(editingTheme.gradients).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px', textTransform: 'capitalize' }}>
                {key}:
              </label>
              <input
                type="text"
                value={value}
                placeholder="from-purple-600 to-pink-600"
                onChange={(e) =>
                  setEditingTheme({
                    ...editingTheme,
                    gradients: { ...editingTheme.gradients, [key]: e.target.value },
                  })
                }
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button
              onClick={saveTheme}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              💾 Сохранить
            </button>
            <button
              onClick={() => {
                setEditingTheme(null);
                setIsCreating(false);
              }}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Управление темами</h1>
        <button
          onClick={createTheme}
          style={{
            padding: '10px 20px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Создать тему
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {themes.map((theme) => (
          <div
            key={theme._id}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'relative',
            }}
          >
            {theme.isDefault && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                По умолчанию
              </div>
            )}

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
              {theme.name}
            </h3>

            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <p style={{ color: '#6B7280', marginBottom: '5px' }}>
                {theme.isDark ? '🌙 Темная' : '☀️ Светлая'}
                {!theme.isActive && ' • Неактивна'}
              </p>
            </div>

            {/* Color preview */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: theme.colors.primary,
                  borderRadius: '6px',
                  border: '2px solid #e5e7eb',
                }}
                title="Primary"
              />
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: theme.colors.secondary,
                  borderRadius: '6px',
                  border: '2px solid #e5e7eb',
                }}
                title="Secondary"
              />
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: theme.colors.accent,
                  borderRadius: '6px',
                  border: '2px solid #e5e7eb',
                }}
                title="Accent"
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setEditingTheme(theme);
                  setIsCreating(false);
                }}
                style={{
                  padding: '6px 12px',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Редактировать
              </button>
              
              {!theme.isDefault && (
                <>
                  <button
                    onClick={() => setDefaultTheme(theme._id)}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    По умолчанию
                  </button>
                  <button
                    onClick={() => deleteTheme(theme._id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {themes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>Нет тем</p>
          <p style={{ fontSize: '14px' }}>Создайте первую тему или запустите: npm run seed-themes</p>
        </div>
      )}
    </div>
  );
}
