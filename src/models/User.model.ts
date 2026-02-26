import mongoose, { Schema, Document } from 'mongoose';

interface IShippingAddress {
  _id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface IWheelGift {
  _id: string;
  type: 'discount' | 'product' | 'freeShipping' | 'personalDiscount';
  value: any;
  description: string;
  expiryDate?: Date;
  expiry?: Date; // Alias for expiryDate
  isUsed: boolean;
  used?: boolean; // Alias for isUsed
  usedAt?: Date;
  orderId?: string;
  discountPercent?: number; // For discount type gifts
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string; // Telegram username для связи с ботом
  role: 'superadmin' | 'admin' | 'customer';  // Добавлен 'customer'
  isPremium?: boolean;
  premiumEndDate?: Date;
  photoDiaryEndDate?: Date; // Дата окончания доступа к фотодневнику
  isLegacyUser?: boolean; // Флаг для пользователей из старого Azure бэка
  azureUserId?: string; // ID пользователя в Azure (для связи)
  firstPhotoDiaryUpload?: Date; // Дата первой загрузки фото в дневник
  lastLoginAt?: Date; // Последний заход на сайт
  contactsEnabled?: boolean; // Разрешены ли контакты (для рассылок)
  
  // НОВЫЕ ПОЛЯ ДЛЯ SHOP
  phone?: string;
  shippingAddresses?: IShippingAddress[];
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
  shopCustomerSince?: Date;
  marketingConsent?: boolean;
  birthDate?: Date;
  
  // Система скидок
  personalDiscount?: number;
  personalDiscountExpiry?: Date;
  
  // Предпочитаемые каналы связи
  preferredContactMethod?: 'telegram' | 'whatsapp' | 'viber' | 'vk' | 'sms' | 'email';
  whatsappPhone?: string;
  viberPhone?: string;
  vkUserId?: string;
  
  // Колесо Фортуны
  fortuneWheelSpins?: number;
  fortuneWheelLastSpin?: Date;
  fortuneWheelGifts?: IWheelGift[];
  
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  telegramUsername: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'customer'],
    default: 'customer'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumEndDate: {
    type: Date
  },
  photoDiaryEndDate: {
    type: Date
  },
  isLegacyUser: {
    type: Boolean,
    default: false
  },
  firstPhotoDiaryUpload: {
    type: Date
  },
  azureUserId: {
    type: String
  },
  lastLoginAt: {
    type: Date
  },
  contactsEnabled: {
    type: Boolean,
    default: true
  },
  // НОВЫЕ ПОЛЯ ДЛЯ SHOP
  phone: {
    type: String
  },
  shippingAddresses: [{
    fullName: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Россия'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  orderCount: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  },
  shopCustomerSince: {
    type: Date
  },
  marketingConsent: {
    type: Boolean,
    default: true
  },
  birthDate: {
    type: Date
  },
  // Система скидок
  personalDiscount: {
    type: Number,
    min: 0,
    max: 100
  },
  personalDiscountExpiry: {
    type: Date
  },
  // Предпочитаемые каналы связи
  preferredContactMethod: {
    type: String,
    enum: ['telegram', 'whatsapp', 'viber', 'vk', 'sms', 'email'],
    default: 'email'
  },
  whatsappPhone: {
    type: String
  },
  viberPhone: {
    type: String
  },
  vkUserId: {
    type: String
  },
  // Колесо Фортуны
  fortuneWheelSpins: {
    type: Number,
    default: 0
  },
  fortuneWheelLastSpin: {
    type: Date
  },
  fortuneWheelGifts: [{
    type: {
      type: String,
      enum: ['discount', 'product', 'freeShipping', 'personalDiscount']
    },
    value: Schema.Types.Mixed,
    description: String,
    expiryDate: Date,
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: Date,
    orderId: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUser>('User', UserSchema);
