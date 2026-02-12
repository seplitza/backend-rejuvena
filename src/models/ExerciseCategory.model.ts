import mongoose, { Schema, Document } from 'mongoose';

export interface IExerciseCategory extends Document {
  name: string;
  slug: string;
  icon?: string; // URL или emoji для иконки категории
  order: number; // Порядок отображения
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseCategorySchema = new Schema<IExerciseCategory>({
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
  icon: {
    type: String,
    default: '💪' // Дефолтная иконка
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ExerciseCategory = mongoose.model<IExerciseCategory>('ExerciseCategory', ExerciseCategorySchema);

export default ExerciseCategory;
