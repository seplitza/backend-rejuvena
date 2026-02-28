import mongoose, { Schema, Document } from 'mongoose';

interface IBundleItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

interface IMarketplaceInfo {
  url: string;
  articleWB?: string;
  skuOzon?: string;
  lastPrice?: number;
  lastChecked?: Date;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string; // Rich text (HTML from TipTap)
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  oldPrice?: number; // Alias for compareAtPrice
  sku: string;
  images: string[];
  category: mongoose.Types.ObjectId;
  tags: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBundle: boolean;
  bundleItems?: IBundleItem[];
  
  // Общие характеристики для всех маркетплейсов
  brand?: string; // Бренд
  manufacturer?: string; // Производитель
  countryOfOrigin?: string; // Страна происхождения
  barcode?: string; // Штрихкод (EAN-13, UPC и т.д.)
  vendorCode?: string; // Артикул производителя
  
  // Габариты и вес
  weight?: number; // Вес в граммах
  dimensions?: {
    length: number; // Длина в см
    width: number;  // Ширина в см
    height: number; // Высота в см
  };
  
  // Характеристики товара (массив ключ-значение)
  characteristics?: Array<{
    name: string;
    value: string;
  }>;
  
  // Wildberries
  wildberries?: {
    nmId?: string; // Артикул WB (номенклатура)
    url?: string; // Ссылка на товар
    price?: number; // Цена на WB
    sizes?: Array<{ // Размерный ряд
      techSize: string;
      wbSize: string;
    }>;
  };
  
  // Ozon
  ozon?: {
    sku?: string; // SKU Ozon
    fboSku?: string; // FBO SKU
    fbsSku?: string; // FBS SKU
    url?: string; // Ссылка на товар
    price?: number; // Цена на Ozon
    categoryId?: number; // ID категории Ozon
  };
  
  // Yandex Market
  yandexMarket?: {
    sku?: string; // SKU Yandex Market
    url?: string; // Ссылка на товар
    price?: number; // Цена на YM
    shopSku?: string; // SKU магазина
    warranty?: string; // Гарантия
  };
  
  // Avito
  avito?: {
    id?: string; // ID объявления Avito
    url?: string; // Ссылка на объявление
    price?: number; // Цена на Avito
    condition?: 'new' | 'used'; // Состояние товара
    address?: string; // Адрес продавца
  };
  
  // Маркетплейсы - direct fields (legacy)
  articleWB?: string;
  skuOzon?: string;
  lastPrice?: number;
  lastChecked?: Date;
  
  // Маркетплейсы - nested (legacy)
  marketplaces?: {
    wildberries?: IMarketplaceInfo;
    ozon?: IMarketplaceInfo;
  };
  
  // SEO и метаданные
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    ingredients?: string; // Состав (для косметики/БАДов)
    usage?: string; // Инструкция по применению
    contraindications?: string; // Противопоказания
    certifications?: string[]; // Сертификаты
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    shortDescription: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    sku: {
      type: String,
      required: true,
      unique: true
    },
    images: [{
      type: String
    }],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: true
    },
    tags: [{
      type: String
    }],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBundle: {
      type: Boolean,
      default: false
    },
    bundleItems: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: {
        type: Number,
        min: 1
      }
    }],
    
    // Общие характеристики
    brand: String,
    manufacturer: String,
    countryOfOrigin: String,
    barcode: String,
    vendorCode: String,
    
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    
    characteristics: [{
      name: String,
      value: String
    }],
    
    // Wildberries
    wildberries: {
      nmId: String,
      url: String,
      price: Number,
      sizes: [{
        techSize: String,
        wbSize: String
      }]
    },
    
    // Ozon
    ozon: {
      sku: String,
      fboSku: String,
      fbsSku: String,
      url: String,
      price: Number,
      categoryId: Number
    },
    
    // Yandex Market
    yandexMarket: {
      sku: String,
      url: String,
      price: Number,
      shopSku: String,
      warranty: String
    },
    
    // Avito
    avito: {
      id: String,
      url: String,
      price: Number,
      condition: {
        type: String,
        enum: ['new', 'used']
      },
      address: String
    },
    
    // Direct marketplace fields (legacy)
    articleWB: String,
    skuOzon: String,
    lastPrice: Number,
    lastChecked: Date,
    // Legacy nested format
    marketplaces: {
      wildberries: {
        url: String,
        articleWB: String,
        lastPrice: Number,
        lastChecked: Date
      },
      ozon: {
        url: String,
        skuOzon: String,
        lastPrice: Number,
        lastChecked: Date
      }
    },
    metadata: {
      seoTitle: String,
      seoDescription: String,
      ingredients: String,
      usage: String,
      contraindications: String,
      certifications: [String]
    },
    seo: {
      metaTitle: String,
      metaDescription: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field - oldPrice as alias for compareAtPrice
ProductSchema.virtual('oldPrice').get(function() {
  return this.compareAtPrice;
}).set(function(value: number | undefined) {
  this.compareAtPrice = value;
});

// Индексы
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ 'marketplaces.wildberries.articleWB': 1 });
ProductSchema.index({ 'marketplaces.ozon.skuOzon': 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
