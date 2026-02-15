/**
 * Email Template Model
 * Stores customizable email templates for marathon notifications
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  type: 'enrollment' | 'pre_start_reminder' | 'start' | 'daily_reminder' | 'completion';
  name: string;
  subject: string;
  htmlTemplate: string;
  variables: string[]; // List of available placeholders like {marathonTitle}, {dayNumber}
  description: string;
  isActive: boolean;
  language: 'ru' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  type: {
    type: String,
    enum: ['enrollment', 'pre_start_reminder', 'start', 'daily_reminder', 'completion'],
    required: true,
    unique: true
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
  }
}, {
  timestamps: true
});

export default mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
