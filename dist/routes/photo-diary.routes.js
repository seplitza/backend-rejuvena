"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_model_1 = __importDefault(require("../models/User.model"));
const PhotoDiary_model_1 = __importDefault(require("../models/PhotoDiary.model"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Пути для хранения фото дневника (абсолютные пути для production)
const PHOTO_DIARY_DIR = process.env.NODE_ENV === 'production'
    ? '/var/www/rejuvena/uploads/photo-diary'
    : path_1.default.join(__dirname, '../../uploads/photo-diary');
const ORIGINALS_DIR = path_1.default.join(PHOTO_DIARY_DIR, 'originals'); // 1 день
const CROPPED_DIR = path_1.default.join(PHOTO_DIARY_DIR, 'cropped'); // 30 дней бесплатно
// Убедимся что директории существуют
(async () => {
    try {
        await promises_1.default.mkdir(ORIGINALS_DIR, { recursive: true });
        await promises_1.default.mkdir(CROPPED_DIR, { recursive: true });
    }
    catch (error) {
        console.error('Failed to create photo-diary directories:', error);
    }
})();
// Mark first photo diary upload
router.post('/mark-first-upload', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_model_1.default.findById(req.userId);
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
    }
    catch (error) {
        console.error('Mark first upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Save photo (cropped, for display) - хранение до user.photoDiaryEndDate
router.post('/save-photo', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { image, photoType, isBeforePhoto, exifData, uploadDate } = req.body;
        if (!image || !photoType || typeof isBeforePhoto !== 'boolean') {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const userId = req.userId;
        const period = isBeforePhoto ? 'before' : 'after';
        const filename = `${userId}_cropped_${period}_${photoType}_${Date.now()}.jpg`;
        const filepath = path_1.default.join(CROPPED_DIR, filename);
        // Декодируем base64 и сохраняем в cropped директорию
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        await promises_1.default.writeFile(filepath, buffer);
        // Создаем запись в БД (expiryDate определяется через user.photoDiaryEndDate)
        const photoDiary = new PhotoDiary_model_1.default({
            userId,
            photoType,
            period,
            storageType: 'cropped',
            filePath: `/uploads/photo-diary/cropped/${filename}`,
            fileName: filename,
            fileSize: buffer.length,
            mimeType: 'image/jpeg',
            exifData: exifData || null,
            uploadDate: uploadDate ? new Date(uploadDate) : new Date()
        });
        await photoDiary.save();
        console.log(`✅ Photo saved: ${photoDiary.filePath} with EXIF: ${!!exifData}`);
        res.json({
            success: true,
            photoUrl: photoDiary.filePath
        });
    }
    catch (error) {
        console.error('Save photo error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all user photos (проверяем user.photoDiaryEndDate)
router.get('/photos', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const now = new Date();
        // Проверяем срок действия фотодневника пользователя
        const user = await User_model_1.default.findById(userId);
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
        const photoRecords = await PhotoDiary_model_1.default.find({
            userId,
            storageType: 'cropped' // Только финальные, не оригиналы
        }).sort({ uploadDate: -1 });
        // Группируем по period и photoType, берем самые свежие
        const photos = {
            before: {},
            after: {}
        };
        const metadata = {
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
                // Сохраняем метаданные
                metadata[period][photoType] = {
                    uploadDate: record.uploadDate.toISOString(),
                    exifData: record.exifData || null
                };
            }
        }
        // Конвертируем в формат для фронтенда
        const result = {
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
            metadata: metadata,
            photoDiaryEndDate: user.photoDiaryEndDate
        });
    }
    catch (error) {
        console.error('Get photos error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
