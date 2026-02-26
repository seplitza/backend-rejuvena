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
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  images: string[];
  category: mongoose.Types.ObjectId;
  tags: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBundle: boolean;
  bundleItems?: IBundleItem[];
  
  // Маркетплейсы
  marketplaces?: {
    wildberries?: IMarketplaceInfo;
    ozon?: IMarketplaceInfo;
  };
  
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    ingredients?: string;
    usage?: string;
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
    weight: {
      type: Number
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    metadata: {
      seoTitle: String,
      seoDescription: String,
      ingredients: String,
      usage: String
    }
  },
  {
    timestamps: true
  }
);

// Индексы
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ 'marketplaces.wildberries.articleWB': 1 });
ProductSchema.index({ 'marketplaces.ozon.skuOzon': 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
