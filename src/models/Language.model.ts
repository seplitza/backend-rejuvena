import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguage extends Document {
  code: string; // en, ru, fr, etc.
  name: string; // English, Russian, French
  nativeName: string; // English, Русский, Français
  isActive: boolean;
  isDefault: boolean;
  flag?: string; // URL or emoji
  createdAt: Date;
  updatedAt: Date;
}

const LanguageSchema = new Schema<ILanguage>({
  code: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  nativeName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  flag: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model<ILanguage>('Language', LanguageSchema);
