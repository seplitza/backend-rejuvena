import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketplacePrice extends Document {
  productId: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId; // Alias for productId
  marketplace: 'wildberries' | 'ozon';
  price: number;
  discountPrice?: number;
  inStock: boolean;
  available: boolean; // Alias for inStock
  rating?: number;
  reviewsCount?: number;
  url: string;
  fetchedAt: Date;
  createdAt: Date;
}

const MarketplacePriceSchema = new Schema<IMarketplacePrice>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    marketplace: {
      type: String,
      enum: ['wildberries', 'ozon'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    inStock: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      min: 0
    },
    url: {
      type: String,
      required: true
    },
    fetchedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Индексы
MarketplacePriceSchema.index({ productId: 1, marketplace: 1, createdAt: -1 });
// TTL индекс: удалять записи старше 30 дней
MarketplacePriceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Виртуальные поля для совместимости с API
MarketplacePriceSchema.virtual('product').get(function() {
  return this.productId;
});

MarketplacePriceSchema.virtual('available').get(function() {
  return this.inStock;
});

// Включаем виртуальные поля в JSON и объекты
MarketplacePriceSchema.set('toJSON', { virtuals: true });
MarketplacePriceSchema.set('toObject', { virtuals: true });

export default mongoose.model<IMarketplacePrice>('MarketplacePrice', MarketplacePriceSchema);
