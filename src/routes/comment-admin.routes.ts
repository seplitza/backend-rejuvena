import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import Comment from '../models/Comment.model';
import User from '../models/User.model';
import Exercise from '../models/Exercise.model';
import Marathon from '../models/Marathon.model';

const router = Router();

// Get all comments with filters (admin moderation)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      priority,
      needsResponse,
      exerciseId,
      marathonId,
      userId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (exerciseId) filter.exerciseId = exerciseId;
    if (marathonId) filter.marathonId = marathonId;
    if (userId) filter.userId = userId;

    // Фильтр "ждущие ответа" = approved но без ответа
    if (needsResponse === 'true') {
      filter.status = 'approved';
      filter.adminResponseId = { $exists: false };
    }

    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const comments = await Comment.find(filter)
      .populate('userId', 'email firstName lastName')
      .populate('exerciseId', 'title')
      .populate('marathonId', 'title')
      .populate('respondedBy', 'firstName lastName email')
      .populate('adminResponseId')
      .sort({ [String(sortBy)]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Comment.countDocuments(filter);

    // Get statistics
    const [pending, urgent, needsResponseCount] = await Promise.all([
      Comment.countDocuments({ status: 'pending' }),
      Comment.countDocuments({ priority: 'urgent', status: { $ne: 'rejected' } }),
      Comment.countDocuments({ 
        status: 'approved', 
        adminResponseId: { $exists: false },
        isPrivate: false
      })
    ]);

    res.json({
      success: true,
      comments,
      stats: {
        pending,
        urgent,
        needsResponse: needsResponseCount
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get comment thread (parent + all replies)
router.get('/:id/thread', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id)
      .populate('userId', 'email firstName lastName')
      .populate('exerciseId', 'title')
      .populate('marathonId', 'title')
      .populate('respondedBy', 'firstName lastName email')
      .lean();

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Get all replies
    const replies = await Comment.find({ parentCommentId: id })
      .populate('userId', 'email firstName lastName')
      .populate('respondedBy', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .lean();

    // Get parent comment if this is a reply
    let parentComment = null;
    if (comment.parentCommentId) {
      parentComment = await Comment.findById(comment.parentCommentId)
        .populate('userId', 'email firstName lastName')
        .lean();
    }

    res.json({
      success: true,
      data: {
        comment,
        replies,
        parentComment
      }
    });
  } catch (error: any) {
    console.error('Get comment thread error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Respond to comment
router.post('/:id/respond', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isPrivate = false } = req.body;

    const originalComment = await Comment.findById(id);
    if (!originalComment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Create response comment
    const responseComment = new Comment({
      userId: req.userId as any,
      exerciseId: originalComment.exerciseId,
      marathonId: originalComment.marathonId,
      marathonDayNumber: originalComment.marathonDayNumber,
      content,
      parentCommentId: id,
      isPrivate,
      status: 'approved' // Admin responses are auto-approved
    });

    await responseComment.save();

    // Update original comment
    originalComment.adminResponseId = responseComment._id;
    originalComment.respondedBy = req.userId as any;
    originalComment.respondedAt = new Date();
    await originalComment.save();

    const populatedResponse = await Comment.findById(responseComment._id)
      .populate('userId', 'firstName lastName email')
      .lean();

    res.json({ success: true, data: populatedResponse });
  } catch (error: any) {
    console.error('Respond to comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update comment status
router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'spam'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'email firstName lastName');

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('Update comment status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update comment priority
router.put('/:id/priority', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!['normal', 'urgent'].includes(priority)) {
      return res.status(400).json({ success: false, error: 'Invalid priority' });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    ).populate('userId', 'email firstName lastName');

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('Update comment priority error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete comment
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Delete all replies
    await Comment.deleteMany({ parentCommentId: id });

    res.json({ success: true, message: 'Comment and replies deleted' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI response suggestions (placeholder for future)
router.post('/:id/ai-suggest', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id)
      .populate('userId', 'email firstName lastName')
      .populate('exerciseId', 'title description')
      .lean();

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // TODO: Integrate with OpenAI/Claude for smart suggestions
    const suggestions = [
      `Спасибо за ваш вопрос! Попробуйте следующее...`,
      `Отличный вопрос! Этот момент важен для правильного выполнения упражнения...`,
      `Рад, что вы обратили на это внимание. Давайте разберем подробнее...`
    ];

    res.json({
      success: true,
      suggestions,
      note: 'AI suggestions feature in development'
    });
  } catch (error: any) {
    console.error('AI suggest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
