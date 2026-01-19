import mongoose, { Schema, Document } from 'mongoose';

export interface IExercisePurchase extends Document {
  userId: mongoose.Types.ObjectId;
  exerciseId: string;
  exerciseName: string;
  price: number;
  purchaseDate: Date;
  expiresAt: Date; // Доступ на 1 месяц
}

const ExercisePurchaseSchema = new Schema<IExercisePurchase>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  exerciseId: {
    type: String,
    required: true
  },
  exerciseName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
ExercisePurchaseSchema.index({ userId: 1, exerciseId: 1 });

export default mongoose.model<IExercisePurchase>('ExercisePurchase', ExercisePurchaseSchema);
