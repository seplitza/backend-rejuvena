import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  slug: string;
  color?: string;
  isVisible?: boolean;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ITag>('Tag', TagSchema);
