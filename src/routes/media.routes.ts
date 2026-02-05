import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Сохраняем оригинальное имя файла с кириллицей
    let filename = file.originalname;
    const filePath = path.join(uploadsDir, filename);
    
    // Если файл с таким именем уже существует, добавляем timestamp
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filename);
      const nameWithoutExt = path.basename(filename, ext);
      const timestamp = Date.now();
      filename = `${nameWithoutExt}-${timestamp}${ext}`;
    }
    
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default (было 10MB)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Upload file
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const isImage = file.mimetype.startsWith('image/');

    // Optimize images
    if (isImage) {
      await sharp(file.path)
        .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(file.path + '.optimized');

      // Replace original with optimized
      fs.unlinkSync(file.path);
      fs.renameSync(file.path + '.optimized', file.path);
    }

    const mediaUrl = `/uploads/${file.filename}`;

    res.json({
      success: true,
      url: mediaUrl,
      filename: file.filename,
      type: isImage ? 'image' : 'video',
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Upload from URL
router.post('/upload-url', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // For now, just return the URL as-is
    // In production, you might want to download and store it locally
    res.json({
      url,
      filename: path.basename(url),
      type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'video'
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    res.status(500).json({ message: 'Upload from URL failed' });
  }
});

// Get all media files
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    
    const fileList = files
      .filter(filename => {
        // Exclude hidden files and directories
        return !filename.startsWith('.') && fs.statSync(path.join(uploadsDir, filename)).isFile();
      })
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const videoExts = ['.mp4', '.mov', '.avi', '.webm'];
        
        let type: 'image' | 'video' = 'image';
        let mimeType = 'application/octet-stream';
        
        if (imageExts.includes(ext)) {
          type = 'image';
          mimeType = `image/${ext.slice(1)}`;
        } else if (videoExts.includes(ext)) {
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
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
});

// Delete media file
router.delete('/:filename', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
