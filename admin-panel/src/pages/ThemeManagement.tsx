/**
 * Theme Management Page
 * Admin interface for creating and managing application color themes
 */

import { useState, useEffect } from 'react';

// Helper function to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Helper function to convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Generate complementary colors based on primary color
function generateComplementaryColors(primaryColor: string) {
  const hsl = hexToHSL(primaryColor);
  
  // Secondary: shift hue by ~30-60 degrees (analogous/triadic)
  const secondaryHue = (hsl.h + 50) % 360;
  const secondary = hslToHex(secondaryHue, hsl.s, Math.max(hsl.l - 5, 40));
  
  // Accent: shift hue by ~150 degrees (complementary direction)
  const accentHue = (hsl.h + 150) % 360;
  const accent = hslToHex(accentHue, Math.min(hsl.s + 10, 90), Math.max(hsl.l, 50));
  
  return { secondary, accent };
}

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
      
      // Check if slug already exists when creating
      if (isCreating) {
        const existingTheme = themes.find(t => t.slug === editingTheme.slug);
        if (existingTheme) {
          const confirm = window.confirm(
            `Тема с названием "${editingTheme.name}" уже существует.\n\nХотите обновить существующую тему?`
          );
          
          if (confirm) {
            // Update existing theme instead
            const response = await fetch(`${API_URL}/api/themes/${existingTheme._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ...editingTheme, _id: existingTheme._id }),
            });
            
            const data = await response.json();
            if (data.success) {
              alert('Существующая тема обновлена!');
              setEditingTheme(null);
              setIsCreating(false);
              loadThemes();
            } else {
              alert(data.error || 'Ошибка обновления темы');
            }
            return;
          } else {
            // User cancelled, suggest changing name
            alert('Пожалуйста, измените название темы для создания новой.');
            return;
          }
        }
      }
      
      const url = isCreating
        ? `${API_URL}/api/themes`
        : `${API_URL}/api/themes/${editingTheme._id}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      // Remove _id for new themes
      const themeData = isCreating ? {
        ...editingTheme,
        _id: undefined
      } : editingTheme;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(themeData),
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
                  {key === 'primary' && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>(Авто-подбор secondary/accent)</span>}
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      let updatedColors = { ...editingTheme.colors, [key]: newColor };
                      
                      // Auto-generate complementary colors when primary changes
                      if (key === 'primary') {
                        const complementary = generateComplementaryColors(newColor);
                        updatedColors = {
                          ...updatedColors,
                          secondary: complementary.secondary,
                          accent: complementary.accent,
                        };
                      }
                      
                      setEditingTheme({
                        ...editingTheme,
                        colors: updatedColors,
                      });
                    }}
                    style={{ width: '50px', height: '40px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      let updatedColors = { ...editingTheme.colors, [key]: newColor };
                      
                      // Auto-generate complementary colors when primary changes
                      if (key === 'primary' && /^#[0-9A-F]{6}$/i.test(newColor)) {
                        const complementary = generateComplementaryColors(newColor);
                        updatedColors = {
                          ...updatedColors,
                          secondary: complementary.secondary,
                          accent: complementary.accent,
                        };
                      }
                      
                      setEditingTheme({
                        ...editingTheme,
                        colors: updatedColors,
                      });
                    }}
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

          {Object.entries(editingTheme.gradients).map(([key, value]) => {
            // Generate gradient suggestions based on theme colors
            const suggestions = [
              `from-[${editingTheme.colors.primary}] to-[${editingTheme.colors.secondary}]`,
              `from-[${editingTheme.colors.accent}] to-[${editingTheme.colors.primary}]`,
              `from-[${editingTheme.colors.accent}] to-[${editingTheme.colors.secondary}]`,
              `from-[${editingTheme.colors.primary}] to-[${editingTheme.colors.accent}]`,
            ];

            return (
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
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditingTheme({
                          ...editingTheme,
                          gradients: { ...editingTheme.gradients, [key]: suggestion },
                        });
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {idx === 0 && 'Primary→Secondary'}
                      {idx === 1 && 'Accent→Primary'}
                      {idx === 2 && 'Accent→Secondary'}
                      {idx === 3 && 'Primary→Accent'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

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
