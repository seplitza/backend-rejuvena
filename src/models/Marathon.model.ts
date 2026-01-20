import mongoose, { Document, Schema } from 'mongoose';

export interface IMarathon extends Document {
  title: string;
  subTitle?: string;
  description?: string;
  image?: string;
  numberOfDays: number;
  cost: number;
  materialAvailabilityDays: number;
  isPublic: boolean;
  isDisplay: boolean;
  isPaid: boolean;
  hasContest: boolean;
  hasComment: boolean;
  autoCrop: boolean;
  language: 'ru' | 'en';
  startDate: Date;
  contestUploadLastDate?: Date;
  finalistAnnouncementDate?: Date;
  votingLastDate?: Date;
  winnerAnnouncementDate?: Date;
  welcomeMessage: string;
  courseDescription: string;
  rules: string;
  tenure: number; // Общая длительность (обучение + практика)
  createdAt: Date;
  updatedAt: Date;
}

const MarathonSchema = new Schema<IMarathon>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subTitle: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String
    },
    numberOfDays: {
      type: Number,
      required: true,
      default: 14
    },
    cost: {
      type: Number,
      required: true,
      default: 0
    },
    materialAvailabilityDays: {
      type: Number,
      default: 30
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    isDisplay: {
      type: Boolean,
      default: false
    },
    isPaid: {
      type: Boolean,
      default: true
    },
    hasContest: {
      type: Boolean,
      default: false
    },
    hasComment: {
      type: Boolean,
      default: false
    },
    autoCrop: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      enum: ['ru', 'en'],
      default: 'ru'
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    contestUploadLastDate: {
      type: Date
    },
    finalistAnnouncementDate: {
      type: Date
    },
    votingLastDate: {
      type: Date
    },
    winnerAnnouncementDate: {
      type: Date
    },
    welcomeMessage: {
      type: String,
      default: ''
    },
    courseDescription: {
      type: String,
      default: ''
    },
    rules: {
      type: String,
      default: ''
    },
    tenure: {
      type: Number,
      required: true,
      default: 44 // 14 дней обучения + 30 дней практики
    }
  },
  {
    timestamps: true
  }
);

// Индексы для быстрого поиска
MarathonSchema.index({ startDate: 1, isPublic: 1 });
MarathonSchema.index({ isDisplay: 1 });

const Marathon = mongoose.model<IMarathon>('Marathon', MarathonSchema);

export default Marathon;
