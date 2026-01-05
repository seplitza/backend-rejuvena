import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia {
  _id?: any;
  url: string;
  type: 'image' | 'video';
  filename: string;
  order: number;
}

export interface IExercise extends Document {
  title: string;
  description: string;
  content: string; // Rich text content from TipTap
  carouselMedia: IMedia[];
  tags: mongoose.Types.ObjectId[];
  category?: string;
  duration?: string; // Duration of the exercise (e.g., "2-3 минуты", "5 в каждую сторону")
  price?: number;
  isPremium?: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const ExerciseSchema = new Schema<IExercise>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  carouselMedia: [MediaSchema],
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  category: {
    type: String,
    default: 'Общие'
  },
  duration: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
ExerciseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
