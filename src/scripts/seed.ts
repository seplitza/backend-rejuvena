import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Tag from '../models/Tag.model';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Tag.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create superadmin
    const hashedPassword = await bcrypt.hash('1234back', 10);
    const superadmin = new User({
      email: 'seplitza@gmail.com',
      password: hashedPassword,
      role: 'superadmin'
    });
    await superadmin.save();
    console.log('👤 Created superadmin: seplitza@gmail.com');

    // Create default tags
    const defaultTags = [
      { name: 'Начинающий', slug: 'beginner', color: '#10B981' },
      { name: 'Продвинутый', slug: 'advanced', color: '#F59E0B' },
      { name: 'Эксперт', slug: 'expert', color: '#EF4444' },
      { name: 'Йога', slug: 'yoga', color: '#8B5CF6' },
      { name: 'Пилатес', slug: 'pilates', color: '#EC4899' },
      { name: 'Растяжка', slug: 'stretching', color: '#06B6D4' }
    ];

    for (const tagData of defaultTags) {
      const tag = new Tag(tagData);
      await tag.save();
    }
    console.log('🏷️  Created default tags');

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: seplitza@gmail.com');
    console.log('   Password: 1234back\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();
