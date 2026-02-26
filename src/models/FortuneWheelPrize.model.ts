import mongoose, { Schema, Document } from 'mongoose';

export interface IFortuneWheelPrize extends Document {
  name: string;
  type: 'discount' | 'product' | 'freeShipping' | 'personalDiscount';
  value: any;
  probability: number;
  icon?: string;
  validityDays?: number;
  productId?: mongoose.Types.ObjectId;
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
    type: {
      type: String,
      enum: ['discount', 'product', 'freeShipping', 'personalDiscount'],
      required: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
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
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Индексы
FortuneWheelPrizeSchema.index({ isActive: 1, probability: -1 });

export default mongoose.model<IFortuneWheelPrize>('FortuneWheelPrize', FortuneWheelPrizeSchema);
