import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  category?: {
    _id: string;
    name: string;
  };
  images: string[];
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/admin/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот товар?')) return;

    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Ошибка при удалении');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await api.put(`/admin/products/${product._id}`, {
        ...product,
        isActive: !product.isActive
      });
      setProducts(products.map(p => p._id === product._id ? response.data : p));
    } catch (error) {
      console.error('Failed to toggle active:', error);
      alert('Ошибка при изменении статуса');
    }
  };

  const filteredProducts = products.filter(p => {
    // Фильтр по статусу
    if (filter === 'active' && !p.isActive) return false;
    if (filter === 'inactive' && p.isActive) return false;
    
    // Поиск по названию или slug
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesSlug = p.slug.toLowerCase().includes(query);
      if (!matchesName && !matchesSlug) return false;
    }
    
    // Фильтр по категории
    if (selectedCategoryId && p.category?._id !== selectedCategoryId) {
      return false;
    }
    
    return true;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Товары</h1>
        <Link
          to="/products/new"
          style={{
            padding: '12px 24px',
            background: '#4F46E5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}
        >
          + Добавить товар
        </Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              border: filter === f ? 'none' : '1px solid #D1D5DB',
              background: filter === f ? '#4F46E5' : 'white',
              color: filter === f ? 'white' : '#374151',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Неактивные'}
          </button>
        ))}
      </div>

      {/* Search and Category Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию или slug..."
          style={{
            flex: '1 1 300px',
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          style={{
            flex: '0 1 200px',
            padding: '12px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            background: 'white'
          }}
        >
          <option value="">Все категории</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {(searchQuery || selectedCategoryId) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryId('');
            }}
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              background: 'white',
              color: '#6B7280',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '16px', color: '#6B7280', fontSize: '14px' }}>
        Найдено товаров: {filteredProducts.length} из {products.length}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                Товар
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                Категория
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                Цена
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                Остаток
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                Статус
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {product.images.length > 0 && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2937' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {product.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#6B7280' }}>
                  {product.category?.name || '-'}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#1F2937' }}>
                    {formatPrice(product.price)}
                  </div>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <div style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'line-through' }}>
                      {formatPrice(product.compareAtPrice)}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: product.stock > 10 ? '#D1FAE5' : product.stock > 0 ? '#FEF3C7' : '#FEE2E2',
                    color: product.stock > 10 ? '#065F46' : product.stock > 0 ? '#92400E' : '#991B1B'
                  }}>
                    {product.stock}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleActive(product)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: product.isActive ? '#D1FAE5' : '#F3F4F6',
                      color: product.isActive ? '#065F46' : '#6B7280',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {product.isActive ? 'Активен' : 'Неактивен'}
                  </button>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link
                      to={`/products/${product._id}`}
                      style={{
                        padding: '6px 12px',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Изменить
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={{
                        padding: '6px 12px',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
            {searchQuery || selectedCategoryId ? 'Товары не найдены' : 'Нет товаров'}
          </div>
        )}
      </div>
    </div>
  );
}
