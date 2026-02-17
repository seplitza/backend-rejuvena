/**
 * PhotoDiary Model
 * Tracks photo storage metadata, expiry dates, and premium status
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPhotoDiary extends Document {
  userId: mongoose.Types.ObjectId;
  photoType: 'front' | 'left34' | 'leftProfile' | 'right34' | 'rightProfile' | 'closeup';
  period: 'before' | 'after';
  storageType: 'original' | 'cropped'; // original = 1 day, cropped = 30 days free
  
  // File paths
  filePath: string; // Relative path from uploads/
  fileName: string;
  
  // Dates
  uploadDate: Date;
  expiryDate: Date; // Auto-calculated based on storageType and premium status
  
  // Premium tracking
  isPremiumAtUpload: boolean; // User's premium status when uploaded
  marathonId?: mongoose.Types.ObjectId; // If uploaded during marathon
  
  // Notifications sent
  notificationsSent: {
    sevenDays: boolean;
    threeDays: boolean;
    oneDay: boolean;
  };
  
  // Metadata
  fileSize: number; // bytes
  mimeType: string;
  exifData?: any; // EXIF metadata from frontend
  
  createdAt: Date;
  updatedAt: Date;
}

const PhotoDiarySchema = new Schema<IPhotoDiary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    photoType: {
      type: String,
      enum: ['front', 'left34', 'leftProfile', 'right34', 'rightProfile', 'closeup'],
      required: true,
    },
    period: {
      type: String,
      enum: ['before', 'after'],
      required: true,
    },
    storageType: {
      type: String,
      enum: ['original', 'cropped'],
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryDate: {
      type: Date,
      index: true, // For cleanup queries (auto-calculated in pre-save hook)
    },
    isPremiumAtUpload: {
      type: Boolean,
      default: false,
    },
    marathonId: {
      type: Schema.Types.ObjectId,
      ref: 'Marathon',
    },
    notificationsSent: {
      sevenDays: {
        type: Boolean,
        default: false,
      },
      threeDays: {
        type: Boolean,
        default: false,
      },
      oneDay: {
        type: Boolean,
        default: false,
      },
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
    },
    exifData: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
PhotoDiarySchema.index({ userId: 1, period: 1, photoType: 1, storageType: 1 });
PhotoDiarySchema.index({ expiryDate: 1 }); // For cleanup cron job
PhotoDiarySchema.index({ expiryDate: 1, notificationsSent: 1 }); // For notifications

// Pre-save hook: автоматически рассчитываем expiryDate
PhotoDiarySchema.pre('save', function(next) {
  if (!this.expiryDate) {
    const now = new Date();
    
    if (this.storageType === 'original') {
      // Originals: 1 day only (for recrop)
      this.expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (this.isPremiumAtUpload) {
      // Premium cropped: 60 days
      this.expiryDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    } else {
      // Free cropped: 30 days
      this.expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// Static methods
PhotoDiarySchema.statics.calculateExpiryDate = function(
  storageType: 'original' | 'cropped',
  isPremium: boolean,
  marathonEndDate?: Date
): Date {
  const now = new Date();
  
  if (storageType === 'original') {
    // Originals: 1 day only (for recrop)
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  
  // Cropped photos
  if (isPremium && marathonEndDate) {
    // Premium with marathon: until marathon end + 30 days
    return new Date(marathonEndDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (isPremium) {
    // Premium without marathon: 60 days (approx marathon length + 30)
    return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  }
  
  // Free: 30 days
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
};

export default mongoose.model<IPhotoDiary>('PhotoDiary', PhotoDiarySchema);
