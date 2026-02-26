import mongoose, { Schema, Document } from 'mongoose';

export interface IProductCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imageUrl?: string; // Alias for image
  parentCategory?: mongoose.Types.ObjectId;
  order: number;
  sortOrder: number; // Alias for order
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
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
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields as aliases
ProductCategorySchema.virtual('imageUrl').get(function() {
  return this.image;
}).set(function(value: string) {
  this.image = value;
});

ProductCategorySchema.virtual('sortOrder').get(function() {
  return this.order;
}).set(function(value: number) {
  this.order = value;
});

// Индексы
ProductCategorySchema.index({ slug: 1 });
ProductCategorySchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IProductCategory>('ProductCategory', ProductCategorySchema);
