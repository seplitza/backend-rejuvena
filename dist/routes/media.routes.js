"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Сохраняем оригинальное имя файла с кириллицей
        let filename = file.originalname;
        const filePath = path_1.default.join(uploadsDir, filename);
        // Если файл с таким именем уже существует, добавляем timestamp
        if (fs_1.default.existsSync(filePath)) {
            const ext = path_1.default.extname(filename);
            const nameWithoutExt = path_1.default.basename(filename, ext);
            const timestamp = Date.now();
            filename = `${nameWithoutExt}-${timestamp}${ext}`;
        }
        cb(null, filename);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default (было 10MB)
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});
// Upload file
router.post('/upload', auth_middleware_1.authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const file = req.file;
        const isImage = file.mimetype.startsWith('image/');
        // Optimize images
        if (isImage) {
            await (0, sharp_1.default)(file.path)
                .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 90 })
                .toFile(file.path + '.optimized');
            // Replace original with optimized
            fs_1.default.unlinkSync(file.path);
            fs_1.default.renameSync(file.path + '.optimized', file.path);
        }
        const mediaUrl = `/uploads/${file.filename}`;
        res.json({
            success: true,
            url: mediaUrl,
            filename: file.filename,
            type: isImage ? 'image' : 'video',
            size: file.size
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});
// Upload from URL
router.post('/upload-url', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }
        // For now, just return the URL as-is
        // In production, you might want to download and store it locally
        res.json({
            url,
            filename: path_1.default.basename(url),
            type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'video'
        });
    }
    catch (error) {
        console.error('Upload URL error:', error);
        res.status(500).json({ message: 'Upload from URL failed' });
    }
});
// Get all media files
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const files = fs_1.default.readdirSync(uploadsDir);
        const fileList = files
            .filter(filename => {
            // Exclude hidden files and directories
            return !filename.startsWith('.') && fs_1.default.statSync(path_1.default.join(uploadsDir, filename)).isFile();
        })
            .map(filename => {
            const filePath = path_1.default.join(uploadsDir, filename);
            const stats = fs_1.default.statSync(filePath);
            const ext = path_1.default.extname(filename).toLowerCase();
            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const videoExts = ['.mp4', '.mov', '.avi', '.webm'];
            let type = 'image';
            let mimeType = 'application/octet-stream';
            if (imageExts.includes(ext)) {
                type = 'image';
                mimeType = `image/${ext.slice(1)}`;
            }
            else if (videoExts.includes(ext)) {
                type = 'video';
                mimeType = `video/${ext.slice(1)}`;
            }
            return {
                _id: filename, // Using filename as ID for simplicity
                url: `/uploads/${filename}`,
                filename,
                type,
                mimeType,
                size: stats.size,
                createdAt: stats.birthtime
            };
        })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
        res.json({ files: fileList });
    }
    catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Failed to get files' });
    }
});
// Delete media file
router.delete('/:filename', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path_1.default.join(uploadsDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            res.json({ message: 'File deleted successfully' });
        }
        else {
            res.status(404).json({ message: 'File not found' });
        }
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Delete failed' });
    }
});
exports.default = router;
