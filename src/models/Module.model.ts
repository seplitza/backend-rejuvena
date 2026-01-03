import mongoose, { Schema, Document } from 'mongoose';

export interface IModule extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  parentModule?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>({
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
  icon: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentModule: {
    type: Schema.Types.ObjectId,
    ref: 'Module'
  }
}, {
  timestamps: true
});

export default mongoose.model<IModule>('Module', ModuleSchema);
