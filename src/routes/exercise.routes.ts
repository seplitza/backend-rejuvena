import { Router, Response } from 'express';
import Exercise from '../models/Exercise.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints - no auth required
// Get all published exercises (for frontend app)
router.get('/public', async (req, res: Response) => {
  try {
    const exercises = await Exercise.find({ isPublished: true })
      .populate('tags')
      .select('-__v')
      .sort({ updatedAt: -1 });
    res.json(exercises);
  } catch (error) {
    console.error('Get public exercises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single published exercise by ID (for frontend app)
router.get('/public/:id', async (req, res: Response) => {
  try {
    const exercise = await Exercise.findOne({ 
      _id: req.params.id, 
      isPublished: true 
    }).populate('tags').select('-__v');
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    console.error('Get public exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoints - auth required
// Get all exercises
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercises = await Exercise.find()
      .populate('tags')
      .sort({ updatedAt: -1 });
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single exercise
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate('tags');
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create exercise
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercise = new Exercise(req.body);
    await exercise.save();
    await exercise.populate('tags');
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update exercise
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('tags');

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete exercise
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update carousel media order
router.put('/:id/carousel/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { mediaOrder } = req.body; // Array of media IDs in new order

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Reorder carousel media
    const reorderedMedia = mediaOrder.map((id: string, index: number) => {
      const media = exercise.carouselMedia.find(m => m._id?.toString() === id);
      if (media) {
        media.order = index;
        return media;
      }
      return null;
    }).filter(Boolean);

    exercise.carouselMedia = reorderedMedia as any;
    await exercise.save();

    res.json(exercise);
  } catch (error) {
    console.error('Reorder media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
