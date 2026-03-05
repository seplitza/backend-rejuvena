import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import Comment from '../models/Comment.model';
import User from '../models/User.model';
import Exercise from '../models/Exercise.model';
import Marathon from '../models/Marathon.model';

const router = Router();

// Get comment statistics (for notifications)
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [pending, urgent, needsResponse] = await Promise.all([
      // На модерации - только корневые комментарии (не ответы)
      Comment.countDocuments({ 
        status: 'pending',
        parentCommentId: { $exists: false }
      }),
      Comment.countDocuments({ 
        priority: 'urgent', 
        status: { $ne: 'rejected' },
        parentCommentId: { $exists: false }
      }),
      Comment.countDocuments({ 
        status: 'approved', 
        adminResponseId: { $exists: false },
        isPrivate: false,
        parentCommentId: { $exists: false }
      })
    ]);

    res.json({
      success: true,
      pending,
      urgent,
      needsResponse,
      total: pending + needsResponse
    });
  } catch (error: any) {
    console.error('Get comment stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
      view = 'moderation', // 'moderation' or 'admin-replies'
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};

    // View filter - separate moderation queue from admin replies
    if (view === 'admin-replies') {
      // Show only admin responses (replies with respondedBy field)
      filter.parentCommentId = { $exists: true }; // Only replies
      filter.respondedBy = { $exists: true }; // Only admin responses
    } else {
      // Moderation view - exclude admin replies from general queue
      // Show only root comments (user questions)
      filter.parentCommentId = { $exists: false }; // Only root comments
    }

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
    const [pending, urgent, needsResponseCount, adminRepliesCount] = await Promise.all([
      // На модерации - только корневые комментарии (вопросы пользователей)
      Comment.countDocuments({ 
        status: 'pending', 
        parentCommentId: { $exists: false }
      }),
      // Горящие - только корневые комментарии
      Comment.countDocuments({ 
        priority: 'urgent', 
        status: { $ne: 'rejected' }, 
        parentCommentId: { $exists: false }
      }),
      // Ждут ответа - одобренные корневые комментарии без ответа админа
      Comment.countDocuments({ 
        status: 'approved', 
        adminResponseId: { $exists: false },
        isPrivate: false,
        parentCommentId: { $exists: false }
      }),
      // Ответов админа - все ответы с respondedBy
      Comment.countDocuments({ 
        parentCommentId: { $exists: true },
        respondedBy: { $exists: true }
      })
    ]);

    res.json({
      success: true,
      comments,
      stats: {
        pending,
        urgent,
        needsResponse: needsResponseCount,
        adminReplies: adminRepliesCount
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
      status: 'approved', // Admin responses are auto-approved
      respondedBy: req.userId as any // Mark this as admin response
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

// Toggle starred status
router.put('/:id/starred', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { starred } = req.body;

    const comment = await Comment.findByIdAndUpdate(
      id,
      { starred: starred !== undefined ? starred : true },
      { new: true }
    ).populate('userId', 'email firstName lastName');

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('Update starred status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of exercises with comments (for filter dropdown)
router.get('/exercises/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercises = await Comment.aggregate([
      {
        $match: {
          exerciseId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$exerciseId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'exercises',
          localField: '_id',
          foreignField: '_id',
          as: 'exercise'
        }
      },
      {
        $unwind: '$exercise'
      },
      {
        $project: {
          _id: 1,
          title: '$exercise.title',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({ success: true, exercises });
  } catch (error: any) {
    console.error('Get exercises list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
