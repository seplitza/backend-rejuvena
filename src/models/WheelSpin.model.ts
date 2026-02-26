import mongoose, { Schema, Document } from 'mongoose';

export interface IWheelSpin extends Document {
  userId: mongoose.Types.ObjectId;
  prizeId: mongoose.Types.ObjectId;
  isUsed: boolean;
  usedAt?: Date;
  orderId?: mongoose.Types.ObjectId;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WheelSpinSchema = new Schema<IWheelSpin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    prizeId: {
      type: Schema.Types.ObjectId,
      ref: 'FortuneWheelPrize',
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Индексы
WheelSpinSchema.index({ userId: 1, createdAt: -1 });
WheelSpinSchema.index({ isUsed: 1, expiryDate: 1 });

export default mongoose.model<IWheelSpin>('WheelSpin', WheelSpinSchema);
