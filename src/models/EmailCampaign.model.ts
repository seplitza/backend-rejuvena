/**
 * Email Campaign Model
 * Automated email sequences (journeys/flows) for marathons
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailStep {
  id: string;
  templateId: mongoose.Types.ObjectId;
  delay: number; // Hours after previous step or trigger
  delayUnit: 'hours' | 'days';
  condition?: {
    type: 'all' | 'opened' | 'clicked' | 'not_opened';
    stepId?: string;
  };
  position: { x: number; y: number }; // For visual editor
}

export interface IEmailCampaign extends Document {
  name: string;
  description: string;
  trigger: {
    type: 'marathon_enrollment' | 'marathon_start' | 'marathon_day' | 'marathon_completion' | 'premium_purchased' | 'manual';
    marathonId?: mongoose.Types.ObjectId;
    dayNumber?: number;
  };
  steps: IEmailStep[];
  isActive: boolean;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmailCampaignSchema = new Schema<IEmailCampaign>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  trigger: {
    type: {
      type: String,
      enum: ['marathon_enrollment', 'marathon_start', 'marathon_day', 'marathon_completion', 'premium_purchased', 'manual'],
      required: true
    },
    marathonId: {
      type: Schema.Types.ObjectId,
      ref: 'Marathon'
    },
    dayNumber: Number
  },
  steps: [{
    id: {
      type: String,
      required: true
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      required: true
    },
    delay: {
      type: Number,
      default: 0
    },
    delayUnit: {
      type: String,
      enum: ['hours', 'days'],
      default: 'hours'
    },
    condition: {
      type: {
        type: String,
        enum: ['all', 'opened', 'clicked', 'not_opened']
      },
      stepId: String
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    }
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for efficient campaign lookups
EmailCampaignSchema.index({ 'trigger.type': 1, isActive: 1 });
EmailCampaignSchema.index({ 'trigger.marathonId': 1 });

export default mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);
