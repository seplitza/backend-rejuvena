/**
 * Offer Routes
 * API endpoints for managing homepage promotional offers
 */

import { Router, Request, Response } from 'express';
import Offer from '../models/Offer.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Public: Get all visible offers (for homepage carousel)
router.get('/', async (req: Request, res: Response) => {
  try {
    const offers = await Offer.find({ isVisible: true })
      .populate('marathonId', 'title description numberOfDays cost isPaid startDate')
      .populate('exerciseId', 'title description isPremium')
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch offers',
    });
  }
});

// Public: Get offer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id)
      .populate('marathonId')
      .populate('exerciseId');

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
    }

    return res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch offer',
    });
  }
});

// Admin: Get all offers (including hidden)
router.get('/admin/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const offers = await Offer.find()
      .populate('marathonId', 'title cost isPaid')
      .populate('exerciseId', 'title isPremium')
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error('Error fetching all offers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch offers',
    });
  }
});

// Admin: Create new offer
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const offerData = req.body;

    // Validate type-specific requirements
    if (offerData.type === 'marathon' && !offerData.marathonId) {
      return res.status(400).json({
        success: false,
        error: 'marathonId is required for marathon offers',
      });
    }

    if (offerData.type === 'exercise' && !offerData.exerciseId) {
      return res.status(400).json({
        success: false,
        error: 'exerciseId is required for exercise offers',
      });
    }

    const offer = new Offer(offerData);
    await offer.save();

    // Populate references before returning
    await offer.populate('marathonId exerciseId');

    return res.status(201).json({
      success: true,
      offer,
    });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create offer',
    });
  }
});

// Admin: Update offer
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const offer = await Offer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('marathonId exerciseId');

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
    }

    return res.status(200).json({
      success: true,
      offer,
    });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update offer',
    });
  }
});

// Admin: Delete offer
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete offer',
    });
  }
});

// Admin: Update offer order (bulk reorder)
router.post('/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { offers } = req.body; // Array of { id, order }

    if (!Array.isArray(offers)) {
      return res.status(400).json({
        success: false,
        error: 'offers must be an array',
      });
    }

    // Update order for each offer
    const updatePromises = offers.map(({ id, order }) =>
      Offer.findByIdAndUpdate(id, { $set: { order } })
    );

    await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      message: 'Offers reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering offers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reorder offers',
    });
  }
});

// Admin: Toggle offer visibility
router.post('/:id/toggle-visibility', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found',
      });
    }

    offer.isVisible = !offer.isVisible;
    await offer.save();

    return res.status(200).json({
      success: true,
      offer,
      message: `Offer ${offer.isVisible ? 'shown' : 'hidden'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling offer visibility:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle offer visibility',
    });
  }
});

export default router;
