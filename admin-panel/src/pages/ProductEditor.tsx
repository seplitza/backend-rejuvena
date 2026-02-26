import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

interface Category {
  _id: string;
  name: string;
}

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    compareAtPrice: 0,
    stock: 0,
    categoryId: '',
    images: [] as string[],
    isActive: true,
    isFeatured: false,
    wbLink: '',
    ozonLink: '',
    wbPrice: 0,
    ozonPrice: 0,
    characteristics: [] as Array<{key: string; value: string}>
  });

  useEffect(() => {
    loadCategories();
    if (id) loadProduct();
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/shop/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await api.get(`/shop/products/${id}`);
      const product = response.data;
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice || 0,
        stock: product.stock || 0,
        categoryId: product.category?._id || '',
        images: product.images || [],
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        wbLink: product.marketplaceData?.wildberries?.url || '',
        ozonLink: product.marketplaceData?.ozon?.url || '',
        wbPrice: product.marketplaceData?.wildberries?.price || 0,
        ozonPrice: product.marketplaceData?.ozon?.price || 0,
        characteristics: product.characteristics || []
      });
    } catch (error) {
      console.error('Failed to load product:', error);
      alert('Ошибка загрузки товара');
    }
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^а-яa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        category: formData.categoryId || undefined,
        marketplaceData: {
          wildberries: formData.wbLink ? {
            url: formData.wbLink,
            price: formData.wbPrice
          } : undefined,
          ozon: formData.ozonLink ? {
            url: formData.ozonLink,
            price: formData.ozonPrice
          } : undefined
        }
      };

      if (id) {
        await api.put(`/shop/products/${id}`, data);
      } else {
        await api.post('/shop/products', data);
      }
      
      alert('Товар сохранен');
      navigate('/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const addCharacteristic = () => {
    setFormData({
      ...formData,
      characteristics: [...formData.characteristics, { key: '', value: '' }]
    });
  };

  const removeCharacteristic = (index: number) => {
    setFormData({
      ...formData,
      characteristics: formData.characteristics.filter((_, i) => i !== index)
    });
  };

  const updateCharacteristic = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...formData.characteristics];
    updated[index][field] = value;
    setFormData({ ...formData, characteristics: updated });
  };

  return (
    <div className="container" style={{ padding: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
          {id ? 'Редактировать товар' : 'Новый товар'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          
          {/* Basic Info */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Основная информация</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Название товара *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={generateSlug}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Краткое описание
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Полное описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Цена и наличие</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Цена *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Старая цена
                </label>
                <input
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Остаток *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Категория
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">Без категории</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Marketplace Links */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Маркетплейсы</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Ссылка на Wildberries
              </label>
              <input
                type="url"
                value={formData.wbLink}
                onChange={(e) => setFormData({ ...formData, wbLink: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Цена на WB
              </label>
              <input
                type="number"
                value={formData.wbPrice}
                onChange={(e) => setFormData({ ...formData, wbPrice: Number(e.target.value) })}
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Ссылка на Ozon
              </label>
              <input
                type="url"
                value={formData.ozonLink}
                onChange={(e) => setFormData({ ...formData, ozonLink: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Цена на Ozon
              </label>
              <input
                type="number"
                value={formData.ozonPrice}
                onChange={(e) => setFormData({ ...formData, ozonPrice: Number(e.target.value) })}
                min="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Characteristics */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Характеристики</h2>
              <button
                type="button"
                onClick={addCharacteristic}
                style={{
                  padding: '8px 16px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                + Добавить
              </button>
            </div>

            {formData.characteristics.map((char, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={char.key}
                  onChange={(e) => updateCharacteristic(index, 'key', e.target.value)}
                  placeholder="Название"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  value={char.value}
                  onChange={(e) => updateCharacteristic(index, 'value', e.target.value)}
                  placeholder="Значение"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeCharacteristic(index)}
                  style={{
                    padding: '12px 16px',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>

          {/* Status */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Активен</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Показывать в хитах продаж</span>
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1
              }}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#6B7280',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
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
