import mongoose, { Document, Schema } from 'mongoose';

export interface IMarathonEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  marathonId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  currentDay: number;
  lastAccessedDay: number;
  completedDays: number[];
  paymentId?: mongoose.Types.ObjectId;
  isPaid: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarathonEnrollmentSchema = new Schema<IMarathonEnrollment>(
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
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    currentDay: {
      type: Number,
      default: 1,
      min: 1
    },
    lastAccessedDay: {
      type: Number,
      default: 0,
      min: 0
    },
    completedDays: [{
      type: Number
    }],
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Составные индексы
MarathonEnrollmentSchema.index({ userId: 1, marathonId: 1 }, { unique: true });
MarathonEnrollmentSchema.index({ marathonId: 1, status: 1 });
MarathonEnrollmentSchema.index({ userId: 1, status: 1 });

const MarathonEnrollment = mongoose.model<IMarathonEnrollment>('MarathonEnrollment', MarathonEnrollmentSchema);

export default MarathonEnrollment;
