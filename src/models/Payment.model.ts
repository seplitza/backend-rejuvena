import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  alfaBankOrderId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'card' | 'sbp' | 'unknown'; // Метод оплаты
  description: string;
  paymentUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: {
    planType?: string;
    duration?: number;
    bindingId?: string;
    type?: string; // 'premium' or 'exercise'
    exerciseId?: string;
    exerciseName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    alfaBankOrderId: {
      type: String,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: '643', // RUB
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'sbp', 'unknown'],
      default: 'unknown',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    paymentUrl: {
      type: String
    },
    errorCode: {
      type: String
    },
    errorMessage: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Индексы для быстрого поиска
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
