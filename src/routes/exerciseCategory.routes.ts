import { Router, Request, Response } from 'express';
import ExerciseCategory from '../models/ExerciseCategory.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * PUBLIC: Get all active categories
 * GET /api/exercise-categories
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await ExerciseCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Get all categories (including inactive)
 * GET /api/exercise-categories/admin/all
 */
router.get('/admin/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const categories = await ExerciseCategory.find()
      .sort({ order: 1, name: 1 });

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('Admin get all categories error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Create new category
 * POST /api/exercise-categories/admin/create
 */
router.post('/admin/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, slug, icon, order } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const category = await ExerciseCategory.create({
      name,
      slug,
      icon,
      order: order || 0,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      category
    });
  } catch (error: any) {
    console.error('Admin create category error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Update category
 * PUT /api/exercise-categories/admin/:id
 */
router.put('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const updateData = req.body;

    const category = await ExerciseCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(200).json({
      success: true,
      category
    });
  } catch (error: any) {
    console.error('Admin update category error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * ADMIN: Delete category
 * DELETE /api/exercise-categories/admin/:id
 */
router.delete('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'superadmin' && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const category = await ExerciseCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted'
    });
  } catch (error: any) {
    console.error('Admin delete category error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
