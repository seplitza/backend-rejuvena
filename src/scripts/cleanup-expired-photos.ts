import mongoose from 'mongoose';
import PhotoDiary from '../models/PhotoDiary.model';
import User from '../models/User.model';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Автоматическое удаление просроченных фото из фотодневника
 * Проверяет user.photoDiaryEndDate для определения истекших фото
 * Запускается через PM2 cron (ежедневно в 3:00)
 */
async function cleanupExpiredPhotos() {
  try {
    console.log('🗑️  Starting expired photo cleanup...');

    // Подключаемся к MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    
    // Находим всех пользователей с истекшим фотодневником
    const expiredUsers = await User.find({
      photoDiaryEndDate: { $lt: now },
      firstPhotoDiaryUpload: { $exists: true } // Только те, кто загружал фото
    });

    console.log(`📊 Found ${expiredUsers.length} users with expired photo diary access`);

    let deletedFiles = 0;
    let deletedRecords = 0;
    let errors = 0;

    for (const user of expiredUsers) {
      try {
        // Находим все фото пользователя
        const userPhotos = await PhotoDiary.find({
          userId: user._id,
          storageType: 'cropped' // Удаляем только cropped фото
        });

        console.log(`  👤 User ${user.email}: ${userPhotos.length} photos to delete`);

        for (const photo of userPhotos) {
          try {
            // Удаляем файл с диска
            const fullPath = path.join(__dirname, '../../', photo.filePath);
            
            try {
              await fs.unlink(fullPath);
              deletedFiles++;
              console.log(`    ✅ Deleted file: ${photo.filePath}`);
            } catch (fileError: any) {
              if (fileError.code === 'ENOENT') {
                console.log(`    ⚠️  File already deleted: ${photo.filePath}`);
              } else {
                throw fileError;
              }
            }

            // Удаляем запись из БД
            await PhotoDiary.findByIdAndDelete(photo._id);
            deletedRecords++;

          } catch (error) {
            errors++;
            console.error(`    ❌ Error deleting photo ${photo._id}:`, error);
          }
        }

      } catch (error) {
        errors++;
        console.error(`  ❌ Error processing user ${user.email}:`, error);
      }
    }

    console.log('\n📈 Cleanup Summary:');
    console.log(`  - Users processed: ${expiredUsers.length}`);
    console.log(`  - Files deleted: ${deletedFiles}`);
    console.log(`  - DB records deleted: ${deletedRecords}`);
    console.log(`  - Errors: ${errors}`);
    console.log('✅ Cleanup completed successfully\n');

  } catch (error) {
    console.error('❌ Cleanup script error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Запускаем скрипт
cleanupExpiredPhotos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
