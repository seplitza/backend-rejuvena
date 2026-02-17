import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import PhotoDiary from '../models/PhotoDiary.model';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Пути для хранения фото дневника
const PHOTO_DIARY_DIR = path.join(__dirname, '../../uploads/photo-diary');
const ORIGINALS_DIR = path.join(PHOTO_DIARY_DIR, 'originals'); // 1 день
const CROPPED_DIR =path.join(PHOTO_DIARY_DIR, 'cropped');   // 30 дней бесплатно

// Убедимся что директории существуют
(async () => {
  try {
    await fs.mkdir(ORIGINALS_DIR, { recursive: true });
    await fs.mkdir(CROPPED_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create photo-diary directories:', error);
  }
})();

// Mark first photo diary upload
router.post('/mark-first-upload', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Установить дату первой загрузки только если её еще нет
    if (!user.firstPhotoDiaryUpload) {
      user.firstPhotoDiaryUpload = new Date();
      await user.save();
      console.log(`✅ First photo diary upload marked for user ${user.email}`);
    }

    res.json({
      success: true,
      firstPhotoDiaryUpload: user.firstPhotoDiaryUpload
    });
  } catch (error) {
    console.error('Mark first upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save photo (cropped, for display) - хранение до user.photoDiaryEndDate
router.post('/save-photo', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { image, photoType, isBeforePhoto } = req.body;

    if (!image || !photoType || typeof isBeforePhoto !== 'boolean') {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userId = req.userId;
    const period = isBeforePhoto ? 'before' : 'after';
    const filename = `${userId}_cropped_${period}_${photoType}_${Date.now()}.jpg`;
    const filepath = path.join(CROPPED_DIR, filename);

    // Декодируем base64 и сохраняем в cropped директорию
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filepath, buffer);

    // Создаем запись в БД (expiryDate определяется через user.photoDiaryEndDate)
    const photoDiary = new PhotoDiary({
      userId,
      photoType,
      period,
      storageType: 'cropped',
      filePath: `/uploads/photo-diary/cropped/${filename}`,
      fileName: filename,
      fileSize: buffer.length,
      mimeType: 'image/jpeg'
    });

    await photoDiary.save();

    console.log(`✅ Photo saved: ${photoDiary.filePath}`);

    res.json({
      success: true,
      photoUrl: photoDiary.filePath
    });
  } catch (error) {
    console.error('Save photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user photos (проверяем user.photoDiaryEndDate)
router.get('/photos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const now = new Date();

    // Проверяем срок действия фотодневника пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Если фотодневник истек, возвращаем пустой результат
    if (user.photoDiaryEndDate && user.photoDiaryEndDate < now) {
      return res.json({
        success: true,
        photos: { before: {}, after: {} },
        expired: true,
        photoDiaryEndDate: user.photoDiaryEndDate
      });
    }

    // Получаем все фото пользователя из БД
    const photoRecords = await PhotoDiary.find({
      userId,
      storageType: 'cropped' // Только финальные, не оригиналы
    }).sort({ uploadDate: -1 });

    // Группируем по period и photoType, берем самые свежие
    const photos: any = {
      before: {},
      after: {}
    };

    for (const record of photoRecords) {
      const period = record.period.toString();
      const photoType = record.photoType;
      
      // Сохраняем только самое свежее фото для каждого типа
      if (!photos[period][photoType] || record.uploadDate > photos[period][photoType].uploadDate) {
        photos[period][photoType] = {
          url: record.filePath,
          uploadDate: record.uploadDate
        };
      }
    }

    // Конвертируем в формат для фронтенда
    const result: Record<string, any> = {
      before: {},
      after: {}
    };

    for (const period of ['before', 'after']) {
      for (const photoType of Object.keys(photos[period])) {
        result[period][photoType] = photos[period][photoType].url;
      }
    }

    res.json({
      success: true,
      photos: result,
      photoDiaryEndDate: user.photoDiaryEndDate
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
