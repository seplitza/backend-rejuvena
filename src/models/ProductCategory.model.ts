import mongoose, { Schema, Document } from 'mongoose';

export interface IProductCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCategorySchema = new Schema<IProductCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String
    },
    image: {
      type: String
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Индексы
ProductCategorySchema.index({ slug: 1 });
ProductCategorySchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IProductCategory>('ProductCategory', ProductCategorySchema);
