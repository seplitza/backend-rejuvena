import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Путь для хранения фото дневника
const PHOTO_DIARY_DIR = path.join(__dirname, '../../uploads/photo-diary');

// Убедимся что директория существует
(async () => {
  try {
    await fs.mkdir(PHOTO_DIARY_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create photo-diary directory:', error);
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

// Save photo (cropped, for display)
router.post('/save-photo', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { image, photoType, isBeforePhoto } = req.body;

    if (!image || !photoType || typeof isBeforePhoto !== 'boolean') {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userId = req.userId;
    const period = isBeforePhoto ? 'before' : 'after';
    const filename = `${userId}_${period}_${photoType}_${Date.now()}.jpg`;
    const filepath = path.join(PHOTO_DIARY_DIR, filename);

    // Декодируем base64 и сохраняем
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));

    const photoUrl = `/uploads/photo-diary/${filename}`;
    console.log(`✅ Photo saved: ${photoUrl}`);

    res.json({
      success: true,
      photoUrl
    });
  } catch (error) {
    console.error('Save photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user photos
router.get('/photos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const files = await fs.readdir(PHOTO_DIARY_DIR);
    
    // Фильтруем файлы пользователя
    const userFiles = files.filter(f => f.startsWith(`${userId}_`));
    
    // Парсим имена файлов
    const photos: any = {
      before: {},
      after: {}
    };

    for (const filename of userFiles) {
      const match = filename.match(/^[^_]+_(before|after)_([^_]+)_(\d+)\.jpg$/);
      if (match) {
        const [, period, photoType, timestamp] = match;
        const url = `/uploads/photo-diary/${filename}`;
        
        // Сохраняем только самое свежее фото для каждого типа
        if (!photos[period][photoType] || parseInt(timestamp) > parseInt(photos[period][photoType].timestamp)) {
          photos[period][photoType] = {
            url,
            timestamp: parseInt(timestamp)
          };
        }
      }
    }

    // Конвертируем в нужный формат
    const result = {
      before: {} as any,
      after: {} as any
    };

    for (const period of ['before', 'after']) {
      for (const photoType of Object.keys(photos[period])) {
        result[period][photoType] = photos[period][photoType].url;
      }
    }

    res.json({
      success: true,
      photos: result
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
