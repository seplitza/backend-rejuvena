import mongoose, { Document, Schema } from 'mongoose';

export interface IMarathonDay extends Document {
  marathonId: mongoose.Types.ObjectId;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string;
  exercises: mongoose.Types.ObjectId[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

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
    exercises: [{
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
