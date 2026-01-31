import { Router, Request, Response } from 'express';
import Marathon from '../models/Marathon.model';
import MarathonDay from '../models/MarathonDay.model';
import MarathonEnrollment from '../models/MarathonEnrollment.model';
import Payment from '../models/Payment.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import emailService from '../services/email.service';
import User from '../models/User.model';

const router = Router();

/**
 * PUBLIC: Get all public marathons
 * GET /api/marathons
 * Optional: Authorization header to get enrollment status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Извлекаем userId из токена если он есть (опционально)
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rejuvena-super-secret-key-2026');
        userId = decoded.userId;
      } catch (err) {
        // Игнорируем ошибки токена для публичного эндпоинта
      }
    }

    const marathons = await Marathon.find({ isPublic: true, isDisplay: true })
      .sort({ startDate: -1 })
      .select('-welcomeMessage -courseDescription -rules');

    // Если пользователь авторизован, добавляем информацию о записи
    if (userId) {
      const enrichedMarathons = await Promise.all(
        marathons.map(async (marathon) => {
          const enrollment = await MarathonEnrollment.findOne({
            userId,
            marathonId: marathon._id
          });

          return {
            ...marathon.toObject(),
            userEnrolled: !!enrollment,
            userEnrollmentStatus: enrollment?.status || null
          };
        })
      );

      return res.status(200).json({
        success: true,
        marathons: enrichedMarathons
      });
    }

    return res.status(200).json({
      success: true,
      marathons
    });
  } catch (error: any) {
    console.error('Get marathons error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUBLIC: Get marathon details
 * GET /api/marathons/:id
 * Optional: Authorization header to get enrollment status
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Извлекаем userId из токена если он есть (опционально)
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rejuvena-super-secret-key-2026');
        userId = decoded.userId;
      } catch (err) {
        // Игнорируем ошибки токена
      }
    }

    const marathon = await Marathon.findById(id);
    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    // Если пользователь авторизован, добавляем информацию о записи
    if (userId) {
      const enrollment = await MarathonEnrollment.findOne({
        userId,
        marathonId: id
      });

      return res.status(200).json({
        success: true,
        marathon: {
          ...marathon.toObject(),
          userEnrolled: !!enrollment,
          userEnrollmentStatus: enrollment?.status || null
        }
      });
    }

    return res.status(200).json({
      success: true,
      marathon
    });
  } catch (error: any) {
    console.error('Get marathon error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUBLIC: Get marathon days
 * GET /api/marathons/:id/days
 */
router.get('/:id/days', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const marathon = await Marathon.findById(id);
    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    const days = await MarathonDay.find({ marathonId: id })
      .populate('exercises', 'title description isPremium carouselMedia')
      .sort({ order: 1 });

    return res.status(200).json({
      success: true,
      days
    });
  } catch (error: any) {
    console.error('Get marathon days error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUBLIC: Get specific marathon day
 * GET /api/marathons/:id/day/:dayNumber
 */
router.get('/:id/day/:dayNumber', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, dayNumber } = req.params;
    const userId = req.userId;

    const marathon = await Marathon.findById(id);
    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    // Проверка записи пользователя
    const enrollment = await MarathonEnrollment.findOne({
      userId,
      marathonId: id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this marathon' });
    }

    // Проверка доступа к дню (рассчитываем от startDate)
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - marathon.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentAvailableDay = daysSinceStart + 1;

    if (Number(dayNumber) > currentAvailableDay) {
      return res.status(403).json({
        error: 'Day not available yet',
        message: `День ${dayNumber} будет доступен ${new Date(marathon.startDate.getTime() + (Number(dayNumber) - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}`
      });
    }

    const day = await MarathonDay.findOne({
      marathonId: id,
      dayNumber: Number(dayNumber)
    }).populate('exercises');

    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    return res.status(200).json({
      success: true,
      day,
      isCompleted: enrollment.completedDays.includes(Number(dayNumber)),
      currentAvailableDay
    });
  } catch (error: any) {
    console.error('Get marathon day error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PROTECTED: Enroll in marathon
 * POST /api/marathons/:id/enroll
 */
router.post('/:id/enroll', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const marathon = await Marathon.findById(id);
    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    // Проверка существующей записи
    const existingEnrollment = await MarathonEnrollment.findOne({
      userId,
      marathonId: id
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this marathon' });
    }

    // Если марафон платный, требуется оплата
    if (marathon.isPaid) {
      return res.status(400).json({
        error: 'Payment required',
        message: 'This marathon requires payment. Please use payment endpoint.'
      });
    }

    // Создаем запись (для бесплатных марафонов)
    const expiresAt = new Date(marathon.startDate);
    expiresAt.setDate(expiresAt.getDate() + marathon.tenure);

    const enrollment = await MarathonEnrollment.create({
      userId,
      marathonId: id,
      status: 'active',
      isPaid: !marathon.isPaid,
      expiresAt
    });

    // Send enrollment confirmation email
    try {
      const user = await User.findById(userId);
      if (user?.email) {
        await emailService.sendMarathonEnrollmentEmail(
          user.email,
          marathon.title,
          marathon.startDate,
          false // free marathon
        );
      }
    } catch (emailError) {
      console.error('Failed to send enrollment email:', emailError);
      // Don't fail the enrollment if email fails
    }

    return res.status(201).json({
      success: true,
      enrollment
    });
  } catch (error: any) {
    console.error('Enroll in marathon error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PROTECTED: Get my enrollments
 * GET /api/marathons/my-enrollments
 */
router.get('/user/my-enrollments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const enrollments = await MarathonEnrollment.find({ userId })
      .populate('marathonId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      enrollments
    });
  } catch (error: any) {
    console.error('Get my enrollments error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PROTECTED: Get marathon progress
 * GET /api/marathons/:id/progress
 */
router.get('/:id/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const enrollment = await MarathonEnrollment.findOne({
      userId,
      marathonId: id
    }).populate('marathonId');

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    return res.status(200).json({
      success: true,
      progress: {
        currentDay: enrollment.currentDay,
        lastAccessedDay: enrollment.lastAccessedDay,
        completedDays: enrollment.completedDays,
        completedCount: enrollment.completedDays.length,
        status: enrollment.status,
        expiresAt: enrollment.expiresAt
      }
    });
  } catch (error: any) {
    console.error('Get marathon progress error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PROTECTED: Complete day
 * POST /api/marathons/:id/complete-day
 */
router.post('/:id/complete-day', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { dayNumber } = req.body;
    const userId = req.userId;

    const enrollment = await MarathonEnrollment.findOne({
      userId,
      marathonId: id
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Добавляем день в завершенные (если еще не добавлен)
    if (!enrollment.completedDays.includes(dayNumber)) {
      enrollment.completedDays.push(dayNumber);
      enrollment.lastAccessedDay = Math.max(enrollment.lastAccessedDay, dayNumber);
      await enrollment.save();
    }

    return res.status(200).json({
      success: true,
      completedDays: enrollment.completedDays
    });
  } catch (error: any) {
    console.error('Complete day error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * ADMIN: Get all marathons
 * GET /api/marathons/admin/all
 */
router.get('/admin/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 25, search } = req.query;

    const filter: any = {};
    if (search && typeof search === 'string') {
      filter.title = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const marathons = await Marathon.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Marathon.countDocuments(filter);

    // Подсчитываем участников для каждого марафона
    const marathonsWithStats = await Promise.all(
      marathons.map(async (marathon) => {
        const participantsCount = await MarathonEnrollment.countDocuments({
          marathonId: marathon._id,
          status: { $in: ['active', 'completed'] }
        });

        return {
          ...marathon.toObject(),
          participantsCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      marathons: marathonsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Admin get marathons error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Create marathon
 * POST /api/marathons/admin/create
 */
router.post('/admin/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const marathonData = req.body;

    const marathon = await Marathon.create(marathonData);

    console.log('Marathon created:', marathon._id, marathon.title);

    return res.status(201).json({
      success: true,
      marathon
    });
  } catch (error: any) {
    console.error('Admin create marathon error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Update marathon
 * PUT /api/marathons/admin/:id
 */
router.put('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const updateData = req.body;

    const marathon = await Marathon.findByIdAndUpdate(id, updateData, { new: true });

    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    console.log('Marathon updated:', marathon._id, marathon.title);

    return res.status(200).json({
      success: true,
      marathon
    });
  } catch (error: any) {
    console.error('Admin update marathon error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Delete marathon
 * DELETE /api/marathons/admin/:id
 */
router.delete('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // Удаляем марафон
    const marathon = await Marathon.findByIdAndDelete(id);

    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    // Удаляем все дни марафона
    await MarathonDay.deleteMany({ marathonId: id });

    // Отменяем все записи
    await MarathonEnrollment.updateMany(
      { marathonId: id },
      { status: 'cancelled' }
    );

    console.log('Marathon deleted:', id);

    return res.status(200).json({
      success: true,
      message: 'Marathon deleted'
    });
  } catch (error: any) {
    console.error('Admin delete marathon error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Add marathon day
 * POST /api/marathons/admin/:id/days
 */
router.post('/admin/:id/days', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const dayData = req.body;

    const marathon = await Marathon.findById(id);
    if (!marathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    const day = await MarathonDay.create({
      marathonId: id,
      ...dayData
    });

    return res.status(201).json({
      success: true,
      day
    });
  } catch (error: any) {
    console.error('Admin add marathon day error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Update marathon day
 * PUT /api/marathons/admin/:id/days/:dayId
 */
router.put('/admin/:id/days/:dayId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { dayId } = req.params;
    const updateData = req.body;

    const day = await MarathonDay.findByIdAndUpdate(dayId, updateData, { new: true });

    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    return res.status(200).json({
      success: true,
      day
    });
  } catch (error: any) {
    console.error('Admin update marathon day error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Delete marathon day
 * DELETE /api/marathons/admin/:id/days/:dayId
 */
router.delete('/admin/:id/days/:dayId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { dayId } = req.params;

    const day = await MarathonDay.findByIdAndDelete(dayId);

    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Day deleted'
    });
  } catch (error: any) {
    console.error('Admin delete marathon day error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Get marathon enrollments
 * GET /api/marathons/admin/:id/enrollments
 */
router.get('/admin/:id/enrollments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const enrollments = await MarathonEnrollment.find({ marathonId: id })
      .populate('userId', 'email firstName lastName')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      enrollments
    });
  } catch (error: any) {
    console.error('Admin get enrollments error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Duplicate marathon
 * POST /api/marathons/admin/:id/duplicate
 */
router.post('/admin/:id/duplicate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const originalMarathon = await Marathon.findById(id);
    if (!originalMarathon) {
      return res.status(404).json({ error: 'Marathon not found' });
    }

    // Создаем копию марафона
    const marathonCopy = await Marathon.create({
      ...originalMarathon.toObject(),
      _id: undefined,
      title: `${originalMarathon.title} (копия)`,
      isPublic: false,
      isDisplay: false,
      startDate: new Date(),
      createdAt: undefined,
      updatedAt: undefined
    });

    // Копируем все дни
    const originalDays = await MarathonDay.find({ marathonId: id });
    for (const day of originalDays) {
      await MarathonDay.create({
        ...day.toObject(),
        _id: undefined,
        marathonId: marathonCopy._id,
        createdAt: undefined,
        updatedAt: undefined
      });
    }

    console.log('Marathon duplicated:', marathonCopy._id);

    return res.status(201).json({
      success: true,
      marathon: marathonCopy
    });
  } catch (error: any) {
    console.error('Admin duplicate marathon error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
