import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDescriptionHistory extends Document {
  product: mongoose.Types.ObjectId;
  originalDescription: string;
  originalShortDescription?: string;
  originalSeo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  enhancedDescription: string;
  enhancedShortDescription: string;
  enhancedSeo: {
    title: string;
    description: string;
    keywords: string[];
  };
  additionalPrompt?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ProductDescriptionHistorySchema = new Schema<IProductDescriptionHistory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    originalDescription: {
      type: String,
      required: true
    },
    originalShortDescription: String,
    originalSeo: {
      metaTitle: String,
      metaDescription: String
    },
    enhancedDescription: {
      type: String,
      required: true
    },
    enhancedShortDescription: {
      type: String,
      required: true
    },
    enhancedSeo: {
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      keywords: [{
        type: String
      }]
    },
    additionalPrompt: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index for finding history by product
ProductDescriptionHistorySchema.index({ product: 1, createdAt: -1 });

export default mongoose.model<IProductDescriptionHistory>(
  'ProductDescriptionHistory',
  ProductDescriptionHistorySchema
);
