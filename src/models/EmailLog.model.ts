/**
 * Email Log Model
 * Tracks individual email sends for analytics
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  stepId: string;
  templateId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  subject: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  provider: 'resend';
  providerId: string; // External ID from email service
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  unsubscribedAt?: Date;
  error?: string;
}

const EmailLogSchema = new Schema<IEmailLog>({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailCampaign',
    required: true
  },
  stepId: {
    type: String,
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'bounced', 'failed'],
    default: 'sent'
  },
  provider: {
    type: String,
    default: 'resend'
  },
  providerId: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  unsubscribedAt: Date,
  error: String
}, {
  timestamps: true
});

// Indexes for analytics queries
EmailLogSchema.index({ campaignId: 1, sentAt: -1 });
EmailLogSchema.index({ userId: 1 });
EmailLogSchema.index({ email: 1 });
EmailLogSchema.index({ status: 1, sentAt: -1 });

export default mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
