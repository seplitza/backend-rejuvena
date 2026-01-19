import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'superadmin' | 'admin';
  isPremium?: boolean;
  premiumEndDate?: Date;
  isLegacyUser?: boolean; // Флаг для пользователей из старого Azure бэка
  azureUserId?: string; // ID пользователя в Azure (для связи)
  firstPhotoDiaryUpload?: Date; // Дата первой загрузки фото в дневник
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
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumEndDate: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUser>('User', UserSchema);
