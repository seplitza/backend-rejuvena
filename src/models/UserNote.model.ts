import mongoose, { Document, Schema } from 'mongoose';

export interface IUserNote extends Document {
  userId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  content: string;
  type: 'note' | 'email' | 'telegram' | 'system';
  isRead: boolean;
  metadata?: {
    subject?: string;
    channel?: string;
    sentAt?: Date;
    deliveryStatus?: 'sent' | 'delivered' | 'failed';
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserNoteSchema = new Schema<IUserNote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['note', 'email', 'telegram', 'system'],
      default: 'note',
      index: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    metadata: {
      subject: String,
      channel: String,
      sentAt: Date,
      deliveryStatus: {
        type: String,
        enum: ['sent', 'delivered', 'failed']
      }
    }
  },
  {
    timestamps: true
  }
);

// Индексы для быстрого поиска
UserNoteSchema.index({ userId: 1, createdAt: -1 });
UserNoteSchema.index({ adminId: 1, createdAt: -1 });
UserNoteSchema.index({ type: 1, userId: 1 });

export default mongoose.model<IUserNote>('UserNote', UserNoteSchema);
