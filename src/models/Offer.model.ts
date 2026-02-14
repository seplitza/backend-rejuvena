/**
 * Offer Model
 * Manages promotional offers displayed on homepage carousel
 * Supports Premium, Marathon, and Exercise offers
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IOffer extends Document {
  type: 'premium' | 'marathon' | 'exercise';
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string; // e.g., "⭐ Популярный", "🔥 Новинка"
  badgeColor?: string; // Tailwind classes: "bg-yellow-400 text-yellow-900"
  
  // Visual styling
  gradient?: {
    from: string; // Hex color
    to: string;   // Hex color
  };
  borderColor?: string; // Tailwind classes
  imagePath?: string;
  
  // Product reference
  marathonId?: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  
  // Premium-specific
  features?: Array<{
    title: string;
    description: string;
  }>;
  
  // Pricing (can override product price)
  price?: number;
  priceLabel?: string; // e.g., "/ месяц", "/ курс"
  
  // Display settings
  isVisible: boolean;
  order: number; // Sort order in carousel
  showToLoggedIn: boolean; // Show to authenticated users
  showToGuests: boolean; // Show to unauthenticated users
  hiddenIfOwned: boolean; // Hide if user already owns (Premium/Marathon)
  
  // CTA button
  buttonText?: string; // e.g., "Купить Premium", "Записаться"
  
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    type: {
      type: String,
      enum: ['premium', 'marathon', 'exercise'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: String,
    description: String,
    badge: String,
    badgeColor: String,
    
    gradient: {
      from: String,
      to: String,
    },
    borderColor: String,
    imagePath: String,
    
    marathonId: {
      type: Schema.Types.ObjectId,
      ref: 'Marathon',
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
    },
    
    features: [
      {
        title: String,
        description: String,
      },
    ],
    
    price: Number,
    priceLabel: String,
    
    isVisible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    showToLoggedIn: {
      type: Boolean,
      default: true,
    },
    showToGuests: {
      type: Boolean,
      default: true,
    },
    hiddenIfOwned: {
      type: Boolean,
      default: true,
    },
    
    buttonText: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient sorting
offerSchema.index({ order: 1, createdAt: -1 });
offerSchema.index({ type: 1, isVisible: 1 });

export default mongoose.model<IOffer>('Offer', offerSchema);
