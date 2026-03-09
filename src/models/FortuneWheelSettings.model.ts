import mongoose, { Document, Schema } from 'mongoose';

export interface IFortuneWheelSettings extends Document {
  isEnabled: boolean;
  updatedAt: Date;
  updatedBy?: string;
}

const FortuneWheelSettingsSchema = new Schema<IFortuneWheelSettings>(
  {
    isEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    updatedBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const FortuneWheelSettings = mongoose.model<IFortuneWheelSettings>(
  'FortuneWheelSettings',
  FortuneWheelSettingsSchema
);

export default FortuneWheelSettings;
