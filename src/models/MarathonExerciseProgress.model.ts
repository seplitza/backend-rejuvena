import mongoose, { Document, Schema } from 'mongoose';

export interface IMarathonExerciseProgress extends Document {
  userId: mongoose.Types.ObjectId;
  marathonId: mongoose.Types.ObjectId;
  dayNumber: number;
  exerciseId: mongoose.Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarathonExerciseProgressSchema = new Schema<IMarathonExerciseProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    marathonId: {
      type: Schema.Types.ObjectId,
      ref: 'Marathon',
      required: true,
      index: true
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Составные индексы для быстрого поиска
MarathonExerciseProgressSchema.index({ userId: 1, marathonId: 1, dayNumber: 1 });
MarathonExerciseProgressSchema.index({ userId: 1, marathonId: 1, exerciseId: 1 }, { unique: true });

const MarathonExerciseProgress = mongoose.model<IMarathonExerciseProgress>(
  'MarathonExerciseProgress',
  MarathonExerciseProgressSchema
);

export default MarathonExerciseProgress;
