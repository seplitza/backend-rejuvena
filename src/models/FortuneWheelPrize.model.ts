import mongoose, { Schema, Document } from 'mongoose';

export interface IFortuneWheelPrize extends Document {
  name: string;
  description?: string;
  type: 'discount' | 'product' | 'freeShipping' | 'personalDiscount' | 'freeProduct' | 'noWin';
  prizeType?: string; // Alias for type
  value: any;
  discountPercent?: number;
  probability: number;
  icon?: string;
  imageUrl?: string; // Alias for icon
  validityDays?: number;
  validFrom?: Date;
  validUntil?: Date;
  productId?: mongoose.Types.ObjectId;
  freeProductId?: mongoose.Types.ObjectId; // Alias for productId
  timesWon?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FortuneWheelPrizeSchema = new Schema<IFortuneWheelPrize>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    type: {
      type: String,
      enum: ['discount', 'product', 'freeShipping', 'personalDiscount', 'freeProduct', 'noWin'],
      required: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
    discountPercent: Number,
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    icon: {
      type: String
    },
    validityDays: {
      type: Number,
      min: 1
    },
    validFrom: Date,
    validUntil: Date,
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    timesWon: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields
FortuneWheelPrizeSchema.virtual('prizeType').get(function() {
  return this.type;
}).set(function(value: string) {
  this.type = value as any;
});

FortuneWheelPrizeSchema.virtual('imageUrl').get(function() {
  return this.icon;
}).set(function(value: string | undefined) {
  this.icon = value;
});

FortuneWheelPrizeSchema.virtual('freeProductId').get(function() {
  return this.productId;
}).set(function(value: mongoose.Types.ObjectId | undefined) {
  this.productId = value;
});

// Индексы
FortuneWheelPrizeSchema.index({ isActive: 1, probability: -1 });

export default mongoose.model<IFortuneWheelPrize>('FortuneWheelPrize', FortuneWheelPrizeSchema);
