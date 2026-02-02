import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.model';

dotenv.config();

const createEditor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'anastasiya@seplitza.ru' });
    if (existingUser) {
      console.log('⚠️  User anastasiya@seplitza.ru already exists');
      
      // Update password
      const hashedPassword = await bcrypt.hash('1234back', 10);
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('🔄 Updated password for anastasiya@seplitza.ru');
    } else {
      // Create new editor user
      const hashedPassword = await bcrypt.hash('1234back', 10);
      const editor = new User({
        email: 'anastasiya@seplitza.ru',
        password: hashedPassword,
        firstName: 'Анастасия',
        role: 'admin'
      });
      await editor.save();
      console.log('👤 Created editor: anastasiya@seplitza.ru');
    }

    console.log('\n✅ Editor account ready!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: anastasiya@seplitza.ru');
    console.log('   Password: 1234back');
    console.log('   Role: admin\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating editor:', error);
    process.exit(1);
  }
};

createEditor();
