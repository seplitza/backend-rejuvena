import mongoose, { Schema, Document } from 'mongoose';

interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  
  // Адрес доставки
  shippingAddress: IShippingAddress;
  
  // Финансы
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode?: string;
  promoDiscount?: number;
  personalDiscount?: number;
  wheelGiftId?: string;
  total: number;
  
  // Статус
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: mongoose.Types.ObjectId;
  
  // Доставка СДЭК
  shippingMethod: 'cdek_courier' | 'cdek_pickup' | 'cdek_postamat';
  cdekOrderId?: string;
  cdekTrackingNumber?: string;
  cdekBarcode?: string;
  cdekOfficeCode?: string;
  cdekOfficeName?: string;
  cdekOfficeAddress?: string;
  estimatedDeliveryDate?: Date;
  
  // Даты
  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [{
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    shippingAddress: {
      fullName: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      postalCode: String,
      country: {
        type: String,
        default: 'Россия'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    promoCode: String,
    promoDiscount: Number,
    personalDiscount: Number,
    wheelGiftId: String,
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    shippingMethod: {
      type: String,
      enum: ['cdek_courier', 'cdek_pickup', 'cdek_postamat'],
      required: true
    },
    cdekOrderId: String,
    cdekTrackingNumber: String,
    cdekBarcode: String,
    cdekOfficeCode: String,
    cdekOfficeName: String,
    cdekOfficeAddress: String,
    estimatedDeliveryDate: Date,
    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },
  {
    timestamps: true
  }
);

// Индексы
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ cdekOrderId: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
