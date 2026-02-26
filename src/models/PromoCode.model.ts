import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'freeShipping';
  discountValue: number;
  freeShipping?: boolean;
  minOrderAmount?: number;
  maxUses?: number;
  usageLimit?: number; // Alias for maxUses
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
    description: String,
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
    freeShipping: {
      type: Boolean,
      default: false
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field - usageLimit as alias for maxUses
PromoCodeSchema.virtual('usageLimit').get(function() {
  return this.maxUses;
}).set(function(value: number | undefined) {
  this.maxUses = value;
});

// Индексы
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ isActive: 1, validUntil: 1 });
PromoCodeSchema.index({ validFrom: 1, validUntil: 1 });

export default mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);
