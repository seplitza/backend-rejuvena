import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorMessage extends Document {
  code: string; // ERROR_LOGIN_FAILED, ERROR_NOT_FOUND, etc.
  translations: {
    languageCode: string;
    message: string;
  }[];
  category?: string; // auth, exercise, general, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ErrorMessageSchema = new Schema<IErrorMessage>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  translations: [{
    languageCode: {
      type: String,
      required: true,
      lowercase: true
    },
    message: {
      type: String,
      required: true
    }
  }],
  category: {
    type: String,
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IErrorMessage>('ErrorMessage', ErrorMessageSchema);
