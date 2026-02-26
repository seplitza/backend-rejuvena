import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;
  discountType: 'percentage' | 'fixed' | 'freeShipping';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableProducts?: mongoose.Types.ObjectId[];
  applicableCategories?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'freeShipping'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      min: 0
    },
    maxUses: {
      type: Number,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicableCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory'
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Индексы
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ isActive: 1, validUntil: 1 });
PromoCodeSchema.index({ validFrom: 1, validUntil: 1 });

export default mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);
