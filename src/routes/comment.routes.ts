import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import Comment from '../models/Comment.model';

const router = Router();

// Get comments for exercise/marathon (frontend)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      exerciseId,
      marathonId,
      marathonDayNumber,
      filter = 'all', // all, exercise, private
      page = 1,
      limit = 50
    } = req.query;

    const query: any = {
      parentCommentId: { $exists: false } // Only top-level comments (not replies)
    };

    // Show approved comments for everyone + user's own pending comments
    query.$or = [
      { status: 'approved' },
      { userId: req.userId, status: 'pending' } // User sees own pending comments
    ];

    // Context-based filtering
    if (exerciseId) query.exerciseId = exerciseId;
    if (marathonId) query.marathonId = marathonId;
    if (marathonDayNumber) query.marathonDayNumber = Number(marathonDayNumber);

    // Type-based filtering
    switch (filter) {
      case 'exercise':
        // Только комментарии к этому упражнению (не общие)
        query.exerciseId = { $exists: true };
        query.isPrivate = false;
        break;
      case 'private':
        // Только личная переписка с тренером
        query.userId = req.userId;
        query.isPrivate = true;
        break;
      case 'all':
      default:
        // Все публичные комментарии ИЛИ свои личные
        query.$or = [
          { isPrivate: false },
          { userId: req.userId, isPrivate: true }
        ];
        break;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const comments = await Comment.find(query)
      .populate('userId', 'firstName lastName')
      .populate('adminResponseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentCommentId: comment._id,
          $or: [
            { status: 'approved' },
            { userId: req.userId, status: 'pending' } // User sees own pending replies
          ]
        })
          .populate('userId', 'firstName lastName')
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...comment,
          replies
        };
      })
    );

    const total = await Comment.countDocuments(query);

    res.json({
      success: true,
      comments: commentsWithReplies,
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

// Create comment
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      exerciseId,
      marathonId,
      marathonDayNumber,
      content,
      isPrivate = false,
      parentCommentId
    } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ success: false, error: 'Content too long (max 5000 characters)' });
    }

    const comment = new Comment({
      userId: req.userId,
      exerciseId,
      marathonId,
      marathonDayNumber,
      content: content.trim(),
      isPrivate,
      parentCommentId,
      status: isPrivate ? 'approved' : 'pending', // Auto-approve private messages
      priority: 'normal'
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'firstName lastName')
      .lean();

    res.json({
      success: true,
      data: populatedComment,
      message: isPrivate 
        ? 'Личное сообщение отправлено тренеру'
        : 'Комментарий отправлен на модерацию'
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update own comment
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findOne({ _id: id, userId: req.userId });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found or unauthorized' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    comment.status = 'pending'; // Требует повторной модерации
    await comment.save();

    res.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete own comment
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findOne({ _id: id, userId: req.userId });
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found or unauthorized' });
    }

    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like comment
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.json({ success: true, data: comment });
  } catch (error: any) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
