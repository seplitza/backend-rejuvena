import mongoose, { Schema, Document } from 'mongoose';

export interface IDayCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  exercises: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DayCategorySchema = new Schema<IDayCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  exercises: [{
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  }]
}, {
  timestamps: true
});

export default mongoose.model<IDayCategory>('DayCategory', DayCategorySchema);
