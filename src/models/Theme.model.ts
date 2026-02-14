/**
 * Theme Model
 * Manages color themes for the application
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITheme extends Document {
  name: string;
  slug: string; // URL-friendly name
  isDark: boolean;
  
  // Color palette
  colors: {
    primary: string;      // Main color (e.g., purple)
    secondary: string;    // Secondary color (e.g., pink)
    accent: string;       // Accent color (e.g., orange)
    background: string;   // Page background
    surface: string;      // Card/surface background
    text: string;         // Main text color
    textSecondary: string; // Secondary text color
  };
  
  // Gradient definitions (used in many places)
  gradients: {
    primary: string;      // e.g., "from-purple-600 to-pink-600"
    secondary: string;    // e.g., "from-orange-500 to-pink-500"
    background: string;   // e.g., "from-pink-50 to-purple-50"
  };
  
  isDefault: boolean;
  isActive: boolean;
  order: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<ITheme>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isDark: {
      type: Boolean,
      default: false,
    },
    colors: {
      primary: {
        type: String,
        required: true,
        default: '#7c3aed', // purple-600
      },
      secondary: {
        type: String,
        required: true,
        default: '#ec4899', // pink-500
      },
      accent: {
        type: String,
        required: true,
        default: '#f97316', // orange-500
      },
      background: {
        type: String,
        required: true,
        default: '#ffffff',
      },
      surface: {
        type: String,
        required: true,
        default: '#f9fafb', // gray-50
      },
      text: {
        type: String,
        required: true,
        default: '#111827', // gray-900
      },
      textSecondary: {
        type: String,
        required: true,
        default: '#6b7280', // gray-500
      },
    },
    gradients: {
      primary: {
        type: String,
        default: 'from-purple-600 to-pink-600',
      },
      secondary: {
        type: String,
        default: 'from-orange-500 to-pink-500',
      },
      background: {
        type: String,
        default: 'from-pink-50 to-purple-50',
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default theme
ThemeSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('Theme').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Index for slug
ThemeSchema.index({ slug: 1 });
ThemeSchema.index({ isActive: 1, order: 1 });

const Theme = mongoose.model<ITheme>('Theme', ThemeSchema);

export default Theme;
