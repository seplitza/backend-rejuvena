import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';

const router = Router();

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

export default router;
