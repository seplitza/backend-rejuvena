/**
 * Email Template Model
 * Stores customizable email templates for marathon notifications
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  type: 'enrollment' | 'pre_start_reminder' | 'start' | 'daily_reminder' | 'completion' | 'photo_diary_7days' | 'photo_diary_3days' | 'photo_diary_1day';
  slug?: string; // Для удобного поиска шаблонов
  name: string;
  subject: string;
  htmlTemplate: string;
  variables: string[]; // List of available placeholders like {marathonTitle}, {dayNumber}
  description: string;
  isActive: boolean;
  language: 'ru' | 'en';
  category?: string; // Для группировки шаблонов
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  type: {
    type: String,
    enum: ['enrollment', 'pre_start_reminder', 'start', 'daily_reminder', 'completion', 'photo_diary_7days', 'photo_diary_3days', 'photo_diary_1day'],
    required: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true // Позволяет иметь null/undefined значения без нарушения unique constraint
  },
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlTemplate: {
    type: String,
    required: true
  },
  variables: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    enum: ['ru', 'en'],
    default: 'ru'
  },
  category: {
    type: String,
    default: 'marathon'
  }
}, {
  timestamps: true
});

export default mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
