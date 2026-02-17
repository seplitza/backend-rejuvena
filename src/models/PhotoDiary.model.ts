/**
 * PhotoDiary Model
 * Tracks photo storage metadata
 * Storage duration is determined by User.photoDiaryEndDate
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPhotoDiary extends Document {
  userId: mongoose.Types.ObjectId;
  photoType: 'front' | 'left34' | 'leftProfile' | 'right34' | 'rightProfile' | 'closeup';
  period: 'before' | 'after';
  storageType: 'original' | 'cropped'; // original = 1 day, cropped = until user.photoDiaryEndDate
  
  // File paths
  filePath: string; // Relative path from uploads/
  fileName: string;
  
  // Dates
  uploadDate: Date;
  
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

export default mongoose.model<IPhotoDiary>('PhotoDiary', PhotoDiarySchema);
