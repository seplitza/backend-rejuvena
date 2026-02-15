import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeType: 'early_adopter' | 'premium' | 'marathon_master' | 'streak_7' | 'streak_30' | 'photo_streak' | 'first_payment' | 'top_performer' | 'custom';
  title: string;
  description: string;
  icon?: string;
  color?: string;
  earnedAt: Date;
  metadata?: {
    marathonId?: mongoose.Types.ObjectId;
    streakDays?: number;
    customReason?: string;
  };
}

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    badgeType: {
      type: String,
      enum: ['early_adopter', 'premium', 'marathon_master', 'streak_7', 'streak_30', 'photo_streak', 'first_payment', 'top_performer', 'custom'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String
    },
    color: {
      type: String,
      default: '#FFD700'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    metadata: {
      marathonId: {
        type: Schema.Types.ObjectId,
        ref: 'Marathon'
      },
      streakDays: Number,
      customReason: String
    }
  },
  {
    timestamps: true
  }
);

// Уникальность badge type для пользователя (кроме custom)
UserBadgeSchema.index({ userId: 1, badgeType: 1 }, { unique: true, partialFilterExpression: { badgeType: { $ne: 'custom' } } });

export default mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema);
