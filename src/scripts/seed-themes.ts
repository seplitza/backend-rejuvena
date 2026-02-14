/**
 * Seed Themes
 * Creates default color themes for the application
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Theme from '../models/Theme.model';

dotenv.config();

const defaultThemes = [
  {
    name: 'Rejuvena Classic',
    slug: 'rejuvena-classic',
    isDark: false,
    colors: {
      primary: '#7c3aed',      // purple-600
      secondary: '#ec4899',    // pink-500
      accent: '#f97316',       // orange-500
      background: '#ffffff',
      surface: '#f9fafb',      // gray-50
      text: '#111827',         // gray-900
      textSecondary: '#6b7280', // gray-500
    },
    gradients: {
      primary: 'from-purple-600 to-pink-600',
      secondary: 'from-orange-500 to-pink-500',
      background: 'from-pink-50 to-purple-50',
    },
    isDefault: true,
    isActive: true,
    order: 1,
  },
  {
    name: 'Ocean Breeze',
    slug: 'ocean-breeze',
    isDark: false,
    colors: {
      primary: '#2563eb',      // blue-600
      secondary: '#06b6d4',    // cyan-500
      accent: '#14b8a6',       // teal-500
      background: '#ffffff',
      surface: '#f0f9ff',      // blue-50
      text: '#1e3a8a',         // blue-900
      textSecondary: '#64748b', // slate-500
    },
    gradients: {
      primary: 'from-blue-600 to-cyan-600',
      secondary: 'from-cyan-500 to-teal-500',
      background: 'from-blue-50 to-cyan-50',
    },
    isDefault: false,
    isActive: true,
    order: 2,
  },
  {
    name: 'Sunset Glow',
    slug: 'sunset-glow',
    isDark: false,
    colors: {
      primary: '#f97316',      // orange-500
      secondary: '#ef4444',    // red-500
      accent: '#facc15',       // yellow-400
      background: '#ffffff',
      surface: '#fffbeb',      // amber-50
      text: '#78350f',         // amber-900
      textSecondary: '#92400e', // amber-800
    },
    gradients: {
      primary: 'from-orange-500 to-red-500',
      secondary: 'from-red-500 to-pink-500',
      background: 'from-orange-50 to-red-50',
    },
    isDefault: false,
    isActive: true,
    order: 3,
  },
  {
    name: 'Forest Fresh',
    slug: 'forest-fresh',
    isDark: false,
    colors: {
      primary: '#16a34a',      // green-600
      secondary: '#10b981',    // emerald-500
      accent: '#84cc16',       // lime-500
      background: '#ffffff',
      surface: '#f0fdf4',      // green-50
      text: '#14532d',         // green-900
      textSecondary: '#15803d', // green-700
    },
    gradients: {
      primary: 'from-green-600 to-emerald-600',
      secondary: 'from-emerald-500 to-lime-500',
      background: 'from-green-50 to-emerald-50',
    },
    isDefault: false,
    isActive: true,
    order: 4,
  },
  {
    name: 'Dark Mode',
    slug: 'dark-mode',
    isDark: true,
    colors: {
      primary: '#a855f7',      // purple-500
      secondary: '#f472b6',    // pink-400
      accent: '#fb923c',       // orange-400
      background: '#111827',   // gray-900
      surface: '#1f2937',      // gray-800
      text: '#f9fafb',         // gray-50
      textSecondary: '#9ca3af', // gray-400
    },
    gradients: {
      primary: 'from-purple-500 to-pink-500',
      secondary: 'from-orange-400 to-pink-400',
      background: 'from-gray-900 to-gray-800',
    },
    isDefault: false,
    isActive: true,
    order: 5,
  },
  {
    name: 'Dark Ocean',
    slug: 'dark-ocean',
    isDark: true,
    colors: {
      primary: '#3b82f6',      // blue-500
      secondary: '#22d3ee',    // cyan-400
      accent: '#2dd4bf',       // teal-400
      background: '#0c4a6e',   // sky-900
      surface: '#075985',      // sky-800
      text: '#e0f2fe',         // sky-100
      textSecondary: '#7dd3fc', // sky-300
    },
    gradients: {
      primary: 'from-blue-500 to-cyan-500',
      secondary: 'from-cyan-400 to-teal-400',
      background: 'from-sky-900 to-blue-900',
    },
    isDefault: false,
    isActive: true,
    order: 6,
  },
];

async function seedThemes() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena'
    );
    console.log('✅ Connected to MongoDB');

    // Check if themes already exist
    const existingThemes = await Theme.countDocuments();
    if (existingThemes > 0) {
      console.log(`⚠️  ${existingThemes} themes already exist. Skipping seed.`);
      console.log('   To re-seed, delete existing themes first.');
      process.exit(0);
    }

    // Insert default themes
    await Theme.insertMany(defaultThemes);
    console.log(`✅ Successfully created ${defaultThemes.length} themes:`);
    defaultThemes.forEach((theme) => {
      console.log(`   - ${theme.name} (${theme.isDark ? 'Dark' : 'Light'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding themes:', error);
    process.exit(1);
  }
}

seedThemes();
