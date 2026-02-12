import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseGroup {
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string; // Для удобства, заполняется при заполнении
  exerciseIds: mongoose.Types.ObjectId[];
}

export interface IMarathonDay extends Document {
  marathonId: mongoose.Types.ObjectId;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string; // Rich text content from TipTap
  exerciseGroups: IExerciseGroup[]; // Упражнения, сгруппированные по категориям
  exercises: mongoose.Types.ObjectId[]; // Для обратной совместимости (deprecated)
  newExerciseIds: mongoose.Types.ObjectId[]; // Новые упражнения в этом дне (подсветка зеленым)
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseGroupSchema = new Schema<IExerciseGroup>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'ExerciseCategory',
    required: true
  },
  categoryName: {
    type: String
  },
  exerciseIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  }]
}, { _id: false });

const MarathonDaySchema = new Schema<IMarathonDay>(
  {
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
    dayType: {
      type: String,
      enum: ['learning', 'practice'],
      required: true,
      default: 'learning'
    },
    description: {
      type: String,
      default: ''
    },
    exerciseGroups: {
      type: [ExerciseGroupSchema],
      default: []
    },
    exercises: [{
      type: Schema.Types.ObjectId,
      ref: 'Exercise'
    }],
    newExerciseIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Exercise'
    }],
    order: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Составной индекс для быстрого поиска дней марафона
MarathonDaySchema.index({ marathonId: 1, dayNumber: 1 }, { unique: true });
MarathonDaySchema.index({ marathonId: 1, order: 1 });

const MarathonDay = mongoose.model<IMarathonDay>('MarathonDay', MarathonDaySchema);

export default MarathonDay;
