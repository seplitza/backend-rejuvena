/**
 * Theme Routes
 * API endpoints for managing application themes
 */

import { Router, Request, Response } from 'express';
import Theme from '../models/Theme.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Public: Get all active themes
router.get('/', async (req: Request, res: Response) => {
  try {
    const themes = await Theme.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      themes,
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch themes',
    });
  }
});

// Public: Get default theme
router.get('/default', async (req: Request, res: Response) => {
  try {
    let theme = await Theme.findOne({ isDefault: true, isActive: true });

    // If no default theme, return first active theme
    if (!theme) {
      theme = await Theme.findOne({ isActive: true }).sort({ order: 1 });
    }

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'No themes available',
      });
    }

    return res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Error fetching default theme:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch default theme',
    });
  }
});

// Public: Get theme by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const theme = await Theme.findOne({ slug, isActive: true });

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Theme not found',
      });
    }

    return res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch theme',
    });
  }
});

// Admin: Get all themes (including inactive)
router.get('/admin/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const themes = await Theme.find()
      .sort({ order: 1, name: 1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      themes,
    });
  } catch (error) {
    console.error('Error fetching all themes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch themes',
    });
  }
});

// Admin: Create new theme
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const themeData = req.body;

    // Generate slug from name if not provided
    if (!themeData.slug) {
      themeData.slug = themeData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const theme = new Theme(themeData);
    await theme.save();

    return res.status(201).json({
      success: true,
      theme,
    });
  } catch (error: any) {
    console.error('Error creating theme:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Theme with this slug already exists',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create theme',
    });
  }
});

// Admin: Update theme
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const theme = await Theme.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Theme not found',
      });
    }

    return res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update theme',
    });
  }
});

// Admin: Delete theme
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const theme = await Theme.findById(id);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Theme not found',
      });
    }

    // Prevent deleting default theme
    if (theme.isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete default theme. Set another theme as default first.',
      });
    }

    await Theme.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Theme deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete theme',
    });
  }
});

// Admin: Set default theme
router.post('/:id/set-default', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const theme = await Theme.findById(id);
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: 'Theme not found',
      });
    }

    // Update all themes to not be default
    await Theme.updateMany({}, { $set: { isDefault: false } });

    // Set this theme as default
    theme.isDefault = true;
    await theme.save();

    return res.status(200).json({
      success: true,
      theme,
      message: 'Default theme updated successfully',
    });
  } catch (error) {
    console.error('Error setting default theme:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to set default theme',
    });
  }
});

export default router;
