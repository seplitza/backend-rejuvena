import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import TipTapEditor from '../components/TipTapEditor';

interface Category {
  _id: string;
  name: string;
}

interface Characteristic {
  name: string;
  value: string;
}

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'marketplace' | 'seo'>('basic');
  
  // Basic fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState(''); // Rich text HTML
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // General product info
  const [brand, setBrand] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [barcode, setBarcode] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [weight, setWeight] = useState(0);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  
  // Wildberries
  const [wbNmId, setWbNmId] = useState('');
  const [wbUrl, setWbUrl] = useState('');
  const [wbPrice, setWbPrice] = useState(0);
  
  // Ozon
  const [ozonSku, setOzonSku] = useState('');
  const [ozonFboSku, setOzonFboSku] = useState('');
  const [ozonFbsSku, setOzonFbsSku] = useState('');
  const [ozonUrl, setOzonUrl] = useState('');
  const [ozonPrice, setOzonPrice] = useState(0);
  const [ozonCategoryId, setOzonCategoryId] = useState('');
  
  // Yandex Market
  const [ymSku, setYmSku] = useState('');
  const [ymShopSku, setYmShopSku] = useState('');
  const [ymUrl, setYmUrl] = useState('');
  const [ymPrice, setYmPrice] = useState(0);
  const [ymWarranty, setYmWarranty] = useState('');
  
  // Avito
  const [avitoId, setAvitoId] = useState('');
  const [avitoUrl, setAvitoUrl] = useState('');
  const [avitoPrice, setAvitoPrice] = useState(0);
  const [avitoCondition, setAvitoCondition] = useState<'new' | 'used'>('new');
  const [avitoAddress, setAvitoAddress] = useState('');
  
  // SEO and metadata
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [usage, setUsage] = useState('');
  const [contraindications, setContraindications] = useState('');

  useEffect(() => {
    loadCategories();
    if (id) loadProduct();
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await api.get(`/admin/products/${id}`);
      const p = response.data;
      
      // Basic
      setName(p.name || '');
      setSlug(p.slug || '');
      setDescription(p.description || '');
      setShortDescription(p.shortDescription || '');
      setPrice(p.price || 0);
      setCompareAtPrice(p.compareAtPrice || 0);
      setStock(p.stock || 0);
      setCategoryId(p.category?._id || '');
      setSku(p.sku || '');
      setImages(p.images || []);
      setIsActive(p.isActive ?? true);
      setIsFeatured(p.isFeatured ?? false);
      
      // General
      setBrand(p.brand || '');
      setManufacturer(p.manufacturer || '');
      setCountryOfOrigin(p.countryOfOrigin || '');
      setBarcode(p.barcode || '');
      setVendorCode(p.vendorCode || '');
      setWeight(p.weight || 0);
      setDimensions(p.dimensions || { length: 0, width: 0, height: 0 });
      setCharacteristics(p.characteristics || []);
      
      // Wildberries
      setWbNmId(p.wildberries?.nmId || '');
      setWbUrl(p.wildberries?.url || '');
      setWbPrice(p.wildberries?.price || 0);
      
      // Ozon
      setOzonSku(p.ozon?.sku || '');
      setOzonFboSku(p.ozon?.fboSku || '');
      setOzonFbsSku(p.ozon?.fbsSku || '');
      setOzonUrl(p.ozon?.url || '');
      setOzonPrice(p.ozon?.price || 0);
      setOzonCategoryId(p.ozon?.categoryId || '');
      
      // Yandex Market
      setYmSku(p.yandexMarket?.sku || '');
      setYmShopSku(p.yandexMarket?.shopSku || '');
      setYmUrl(p.yandexMarket?.url || '');
      setYmPrice(p.yandexMarket?.price || 0);
      setYmWarranty(p.yandexMarket?.warranty || '');
      
      // Avito
      setAvitoId(p.avito?.id || '');
      setAvitoUrl(p.avito?.url || '');
      setAvitoPrice(p.avito?.price || 0);
      setAvitoCondition(p.avito?.condition || 'new');
      setAvitoAddress(p.avito?.address || '');
      
      // SEO
      setSeoTitle(p.metadata?.seoTitle || '');
      setSeoDescription(p.metadata?.seoDescription || '');
      setIngredients(p.metadata?.ingredients || '');
      setUsage(p.metadata?.usage || '');
      setContraindications(p.metadata?.contraindications || '');
      
    } catch (error) {
      console.error('Failed to load product:', error);
      alert('Ошибка загрузки товара');
    }
  };

  const generateSlug = () => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^а-яa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim() || !sku.trim()) {
      alert('Заполните название, slug и артикул');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name,
        slug,
        description,
        shortDescription,
        price,
        compareAtPrice: compareAtPrice || undefined,
        stock,
        category: categoryId || undefined,
        sku,
        images,
        isActive,
        isFeatured,
        
        brand: brand || undefined,
        manufacturer: manufacturer || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
        barcode: barcode || undefined,
        vendorCode: vendorCode || undefined,
        weight: weight || undefined,
        dimensions: dimensions.length || dimensions.width || dimensions.height ? dimensions : undefined,
        characteristics: characteristics.filter(c => c.name && c.value),
        
        wildberries: {
          nmId: wbNmId || undefined,
          url: wbUrl || undefined,
          price: wbPrice || undefined
        },
        
        ozon: {
          sku: ozonSku || undefined,
          fboSku: ozonFboSku || undefined,
          fbsSku: ozonFbsSku || undefined,
          url: ozonUrl || undefined,
          price: ozonPrice || undefined,
          categoryId: ozonCategoryId ? Number(ozonCategoryId) : undefined
        },
        
        yandexMarket: {
          sku: ymSku || undefined,
          shopSku: ymShopSku || undefined,
          url: ymUrl || undefined,
          price: ymPrice || undefined,
          warranty: ymWarranty || undefined
        },
        
        avito: {
          id: avitoId || undefined,
          url: avitoUrl || undefined,
          price: avitoPrice || undefined,
          condition: avitoCondition,
          address: avitoAddress || undefined
        },
        
        metadata: {
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          ingredients: ingredients || undefined,
          usage: usage || undefined,
          contraindications: contraindications || undefined
        }
      };

      if (id) {
        await api.put(`/admin/products/${id}`, data);
        alert('Товар обновлен!');
      } else {
        await api.post('/admin/products', data);
        alert('Товар создан!');
      }
      
      navigate('/products');
    } catch (error: any) {
      console.error('Failed to save product:', error);
      alert(error.response?.data?.error || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const addCharacteristic = () => {
    setCharacteristics([...characteristics, { name: '', value: '' }]);
  };

  const removeCharacteristic = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  const updateCharacteristic = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...characteristics];
    updated[index][field] = value;
    setCharacteristics(updated);
  };

  return (
    <div className="container" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
          {id ? 'Редактировать товар' : 'Новый товар'}
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'basic' ? '2px solid #4F46E5' : '2px solid transparent',
              color: activeTab === 'basic' ? '#4F46E5' : '#6B7280',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Основное
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'marketplace' ? '2px solid #4F46E5' : '2px solid transparent',
              color: activeTab === 'marketplace' ? '#4F46E5' : '#6B7280',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Маркетплейсы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'seo' ? '2px solid #4F46E5' : '2px solid transparent',
              color: activeTab === 'seo' ? '#4F46E5' : '#6B7280',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            SEO и метаданные
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          
          {/* BASIC TAB */}
          {activeTab === 'basic' && (
            <>
              {/* Basic Info */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Основная информация</h2>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
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
                    Артикул (SKU) *
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
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
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={3}
                    placeholder="Краткое описание для карточки товара в каталоге"
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
                    Полное описание (с поддержкой форматирования и видео)
                  </label>
                  <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                    <TipTapEditor content={description} onChange={setDescription} />
                  </div>
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
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                      min="0"
                      step="0.01"
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
                      Старая цена (зачеркнутая)
                    </label>
                    <input
                      type="number"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
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
                      Остаток на складе *
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
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
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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

              {/* Product Info */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Информация о товаре</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Бренд
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Например: REJUVENA"
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
                      Производитель
                    </label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="Название компании-производителя"
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
                      Страна производства
                    </label>
                    <input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      placeholder="Например: Россия"
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
                      Штрихкод (EAN-13, UPC)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="13 цифр для EAN-13"
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
                      Артикул производителя
                    </label>
                    <input
                      type="text"
                      value={vendorCode}
                      onChange={(e) => setVendorCode(e.target.value)}
                      placeholder="Артикул от производителя"
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

                {/* Dimensions and weight */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '24px' }}>
                  Габариты и вес
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Длина (см)
                    </label>
                    <input
                      type="number"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                      min="0"
                      step="0.1"
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
                      Ширина (см)
                    </label>
                    <input
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                      min="0"
                      step="0.1"
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
                      Высота (см)
                    </label>
                    <input
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                      min="0"
                      step="0.1"
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
                      Вес (г)
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      min="0"
                      step="1"
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

              {/* Characteristics */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Характеристики товара</h2>
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
                    + Добавить характеристику
                  </button>
                </div>

                {characteristics.map((char, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => updateCharacteristic(index, 'name', e.target.value)}
                      placeholder="Название (например: Объем)"
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
                      placeholder="Значение (например: 120 мл)"
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
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Статус</h2>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Товар активен (показывать в каталоге)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Показывать в хитах продаж</span>
                </label>
              </div>
            </>
          )}

          {/* MARKETPLACE TAB */}
          {activeTab === 'marketplace' && (
            <>
              {/* Wildberries */}
              <div style={{ marginBottom: '32px', padding: '24px', background: '#F9FAFB', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#C026D3' }}>
                  🟣 Wildberries
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Артикул WB (nmId)
                    </label>
                    <input
                      type="text"
                      value={wbNmId}
                      onChange={(e) => setWbNmId(e.target.value)}
                      placeholder="Номер номенклатуры"
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
                      Цена на WB
                    </label>
                    <input
                      type="number"
                      value={wbPrice}
                      onChange={(e) => setWbPrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Ссылка на товар
                    </label>
                    <input
                      type="url"
                      value={wbUrl}
                      onChange={(e) => setWbUrl(e.target.value)}
                      placeholder="https://www.wildberries.ru/..."
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

              {/* Ozon */}
              <div style={{ marginBottom: '32px', padding: '24px', background: '#F0F9FF', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0284C7' }}>
                  🔵 Ozon
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      SKU Ozon
                    </label>
                    <input
                      type="text"
                      value={ozonSku}
                      onChange={(e) => setOzonSku(e.target.value)}
                      placeholder="Артикул товара"
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
                      FBO SKU
                    </label>
                    <input
                      type="text"
                      value={ozonFboSku}
                      onChange={(e) => setOzonFboSku(e.target.value)}
                      placeholder="SKU для FBO"
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
                      FBS SKU
                    </label>
                    <input
                      type="text"
                      value={ozonFbsSku}
                      onChange={(e) => setOzonFbsSku(e.target.value)}
                      placeholder="SKU для FBS"
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
                      Цена на Ozon
                    </label>
                    <input
                      type="number"
                      value={ozonPrice}
                      onChange={(e) => setOzonPrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="0"
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
                      ID категории Ozon
                    </label>
                    <input
                      type="text"
                      value={ozonCategoryId}
                      onChange={(e) => setOzonCategoryId(e.target.value)}
                      placeholder="ID категории"
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
                      Ссылка на товар
                    </label>
                    <input
                      type="url"
                      value={ozonUrl}
                      onChange={(e) => setOzonUrl(e.target.value)}
                      placeholder="https://www.ozon.ru/..."
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

              {/* Yandex Market */}
              <div style={{ marginBottom: '32px', padding: '24px', background: '#FEF3C7', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#D97706' }}>
                  🟡 Yandex Market
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      SKU Yandex Market
                    </label>
                    <input
                      type="text"
                      value={ymSku}
                      onChange={(e) => setYmSku(e.target.value)}
                      placeholder="Артикул"
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
                      SKU магазина
                    </label>
                    <input
                      type="text"
                      value={ymShopSku}
                      onChange={(e) => setYmShopSku(e.target.value)}
                      placeholder="Внутренний SKU"
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
                      Цена на YM
                    </label>
                    <input
                      type="number"
                      value={ymPrice}
                      onChange={(e) => setYmPrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="0"
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
                      Гарантия
                    </label>
                    <input
                      type="text"
                      value={ymWarranty}
                      onChange={(e) => setYmWarranty(e.target.value)}
                      placeholder="Например: 1 год"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Ссылка на товар
                    </label>
                    <input
                      type="url"
                      value={ymUrl}
                      onChange={(e) => setYmUrl(e.target.value)}
                      placeholder="https://market.yandex.ru/..."
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

              {/* Avito */}
              <div style={{ marginBottom: '32px', padding: '24px', background: '#DCFCE7', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#16A34A' }}>
                  🟢 Avito
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      ID объявления
                    </label>
                    <input
                      type="text"
                      value={avitoId}
                      onChange={(e) => setAvitoId(e.target.value)}
                      placeholder="ID объявления на Avito"
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
                      Цена на Avito
                    </label>
                    <input
                      type="number"
                      value={avitoPrice}
                      onChange={(e) => setAvitoPrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="0"
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
                      Состояние товара
                    </label>
                    <select
                      value={avitoCondition}
                      onChange={(e) => setAvitoCondition(e.target.value as 'new' | 'used')}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="new">Новый</option>
                      <option value="used">Б/У</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Адрес продавца
                    </label>
                    <input
                      type="text"
                      value={avitoAddress}
                      onChange={(e) => setAvitoAddress(e.target.value)}
                      placeholder="Город, улица"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Ссылка на объявление
                    </label>
                    <input
                      type="url"
                      value={avitoUrl}
                      onChange={(e) => setAvitoUrl(e.target.value)}
                      placeholder="https://www.avito.ru/..."
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
            </>
          )}

          {/* SEO TAB */}
          {activeTab === 'seo' && (
            <>
              {/* SEO */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>SEO оптимизация</h2>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    SEO заголовок (meta title)
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Название товара для поисковых систем"
                    maxLength={60}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    {seoTitle.length}/60 символов
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    SEO описание (meta description)
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Краткое описание товара для поисковых систем"
                    rows={3}
                    maxLength={160}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    {seoDescription.length}/160 символов
                  </p>
                </div>
              </div>

              {/* Product Metadata (for cosmetics/supplements) */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  Дополнительная информация (для косметики/БАДов)
                </h2>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Состав
                  </label>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Полный состав продукта"
                    rows={4}
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
                    Инструкция по применению
                  </label>
                  <textarea
                    value={usage}
                    onChange={(e) => setUsage(e.target.value)}
                    placeholder="Как использовать товар"
                    rows={4}
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
                    Противопоказания
                  </label>
                  <textarea
                    value={contraindications}
                    onChange={(e) => setContraindications(e.target.value)}
                    placeholder="Противопоказания и предупреждения"
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
              </div>
            </>
          )}

          {/* Submit buttons (always visible) */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
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
              {saving ? 'Сохранение...' : id ? 'Обновить товар' : 'Создать товар'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#6B7280',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.8 : 1
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
