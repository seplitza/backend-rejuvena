import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.model';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/rejuvena');
    console.log('✓ Connected to MongoDB');

    const email = 'Seplitza@gmail.com';
    const password = '1234back';

    // Проверка, существует ли уже пользователь
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log(`User ${email} already exists. Updating role to superadmin...`);
      existingUser.role = 'superadmin';
      existingUser.firstName = 'Admin';
      existingUser.lastName = 'Rejuvena'; 
      await existingUser.save();
      console.log(`✓ User ${email} updated to superadmin`);
    } else {
      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Создаем админа
      const admin = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Rejuvena',
        role: 'superadmin',
        createdAt: new Date()
      });

      await admin.save();
      console.log(`✓ Admin user created successfully`);
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
    }

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
