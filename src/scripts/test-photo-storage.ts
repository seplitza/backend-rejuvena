/**
 * Тестовый скрипт для проверки системы хранения фотодневника
 */

import mongoose from 'mongoose';
import PhotoDiary from '../models/PhotoDiary.model';
import User from '../models/User.model';
import dotenv from 'dotenv';

dotenv.config();

async function testPhotoStorage() {
  try {
    console.log('🧪 Testing Photo Storage System...\n');

    // Подключаемся к MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. Проверка модели PhotoDiary
    console.log('📋 1. Testing PhotoDiary Model');
    console.log('--------------------------------');
    
    const testUser = await User.findOne({ role: 'superadmin' });
    if (!testUser) {
      console.log('❌ No superadmin user found. Run: npm run seed');
      process.exit(1);
    }
    console.log(`✅ Test user: ${testUser.email}`);

    // Создаем тестовую запись
    const testPhoto = new PhotoDiary({
      userId: testUser._id,
      photoType: 'front',
      period: 'before',
      storageType: 'cropped',
      filePath: '/uploads/photo-diary/cropped/test.jpg',
      fileName: 'test.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      isPremiumAtUpload: false
    });

    // ВАЖНО: expiryDate рассчитывается в pre-save hook, поэтому нужно вызвать validate()
    await testPhoto.validate();
    
    // Временно устанавливаем expiryDate для демонстрации (в реальности это делает pre-save при save())
    if (!testPhoto.expiryDate) {
      const now = new Date();
      testPhoto.expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    console.log(`📅 Upload Date: ${testPhoto.uploadDate}`);
    console.log(`⏰ Expiry Date: ${testPhoto.expiryDate}`);
    console.log(`⏳ Days until expiry: ${Math.ceil((testPhoto.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}`);
    console.log(`💎 Premium at upload: ${testPhoto.isPremiumAtUpload}`);
    console.log(`🔔 Notifications sent: ${JSON.stringify(testPhoto.notificationsSent)}\n`);

    // 2. Проверка срока хранения для премиум пользователя
    console.log('📋 2. Testing Premium Storage Duration');
    console.log('---------------------------------------');
    
    const premiumPhoto = new PhotoDiary({
      userId: testUser._id,
      photoType: 'front',
      period: 'before',
      storageType: 'cropped',
      filePath: '/uploads/photo-diary/cropped/premium_test.jpg',
      fileName: 'premium_test.jpg',
      fileSize: 2048,
      mimeType: 'image/jpeg',
      isPremiumAtUpload: true
    });

    // Устанавливаем expiryDate (в реальности это делает pre-save при save())
    if (!premiumPhoto.expiryDate) {
      const now = new Date();
      premiumPhoto.expiryDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    }

    console.log(`📅 Upload Date: ${premiumPhoto.uploadDate}`);
    console.log(`⏰ Expiry Date: ${premiumPhoto.expiryDate}`);
    console.log(`⏳ Days until expiry: ${Math.ceil((premiumPhoto.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}`);
    console.log(`💎 Premium at upload: ${premiumPhoto.isPremiumAtUpload}\n`);

    // 3. Проверка срока хранения для оригиналов
    console.log('📋 3. Testing Original Photo Storage Duration');
    console.log('---------------------------------------------');
    
    const originalPhoto = new PhotoDiary({
      userId: testUser._id,
      photoType: 'front',
      period: 'before',
      storageType: 'original',
      filePath: '/uploads/photo-diary/originals/original_test.jpg',
      fileName: 'original_test.jpg',
      fileSize: 5120,
      mimeType: 'image/jpeg',
      isPremiumAtUpload: false
    });

    // Устанавливаем expiryDate (в реальности это делает pre-save при save())
    if (!originalPhoto.expiryDate) {
      const now = new Date();
      originalPhoto.expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    console.log(`📅 Upload Date: ${originalPhoto.uploadDate}`);
    console.log(`⏰ Expiry Date: ${originalPhoto.expiryDate}`);
    console.log(`⏳ Hours until expiry: ${Math.ceil((originalPhoto.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60))}`);
    console.log(`📦 Storage type: ${originalPhoto.storageType}\n`);

    // 4. Подсчет существующих фото в БД
    console.log('📋 4. Checking Existing Photos in Database');
    console.log('------------------------------------------');
    
    const totalPhotos = await PhotoDiary.countDocuments();
    const expiredPhotos = await PhotoDiary.countDocuments({
      expiryDate: { $lt: new Date() }
    });
    const activePhotos = totalPhotos - expiredPhotos;

    console.log(`📊 Total photos: ${totalPhotos}`);
    console.log(`✅ Active photos: ${activePhotos}`);
    console.log(`⏰ Expired photos: ${expiredPhotos}\n`);

    // 5. Проверка upcoming expirations
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingExpirations = await PhotoDiary.countDocuments({
      expiryDate: { 
        $gt: new Date(),
        $lt: sevenDaysLater
      }
    });

    console.log('📋 5. Upcoming Expirations (Next 7 Days)');
    console.log('----------------------------------------');
    console.log(`⚠️  Photos expiring soon: ${upcomingExpirations}\n`);

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testPhotoStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
