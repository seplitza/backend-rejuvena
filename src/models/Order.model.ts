import mongoose, { Schema, Document } from 'mongoose';

interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId; // Alias for productId
  productName: string;
  quantity: number;
  price: number;
  total?: number;
}

interface IShippingAddress {
  fullName: string;
  name?: string; // Alias for fullName
  phone: string;
  address: string;
  street?: string;
  house?: string;
  flat?: string;
  city: string;
  postalCode: string;
  country: string;
}

interface IStatusHistoryItem {
  status: string;
  timestamp: Date;
  notes?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId; // Alias for userId
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
  fortuneWheelGifts?: Array<{
    giftId: mongoose.Types.ObjectId;
    description: string;
    discount?: number;
  }>;
  total: number;
  totalAmount: number; // Alias for total
  
  // Статус
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  statusHistory: IStatusHistoryItem[];
  paymentStatus: 'awaiting_payment' | 'pending' | 'completed' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'online' | 'cash' | 'card';
  paymentId?: mongoose.Types.ObjectId;
  
  // Доставка СДЭК
  shippingMethod: 'cdek_courier' | 'cdek_pickup' | 'cdek_postamat' | 'courier' | 'pickup' | 'cdek';
  deliveryMethod?: string; // Alias for shippingMethod
  cdekOrderId?: string;
  cdekTrackingNumber?: string;
  cdekBarcode?: string;
  cdekOfficeCode?: string;
  cdekOfficeName?: string;
  cdekOfficeAddress?: string;
  estimatedDeliveryDate?: Date;
  
  // Additional
  notes?: string;
  contactMethod?: 'phone' | 'telegram' | 'whatsapp' | 'viber' | 'vk';
  
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
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    statusHistory: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      notes: String
    }],
    paymentStatus: {
      type: String,
      enum: ['awaiting_payment', 'pending', 'completed', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'cash', 'card']
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    shippingMethod: {
      type: String,
      enum: ['cdek_courier', 'cdek_pickup', 'cdek_postamat', 'courier', 'pickup', 'cdek'],
      required: true
    },
    fortuneWheelGifts: [{
      giftId: Schema.Types.ObjectId,
      description: String,
      discount: Number
    }],
    notes: String,
    contactMethod: {
      type: String,
      enum: ['phone', 'telegram', 'whatsapp', 'viber', 'vk']
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields as aliases
OrderSchema.virtual('user').get(function() {
  return this.userId;
}).set(function(value: mongoose.Types.ObjectId) {
  this.userId = value;
});

OrderSchema.virtual('totalAmount').get(function() {
  return this.total;
}).set(function(value: number) {
  this.total = value;
});

OrderSchema.virtual('deliveryMethod').get(function() {
  return this.shippingMethod;
}).set(function(value: string) {
  this.shippingMethod = value as any;
});

// Индексы
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ cdekOrderId: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
