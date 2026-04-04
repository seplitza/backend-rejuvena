"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
const router = (0, express_1.Router)();
// Get comments for exercise/marathon (frontend)
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { exerciseId, marathonId, marathonDayNumber, filter = 'all', // all, exercise, private
        page = 1, limit = 50 } = req.query;
        const query = {
            parentCommentId: { $exists: false } // Only top-level comments (not replies)
        };
        // Show approved comments for everyone + user's own pending comments
        query.$or = [
            { status: 'approved' },
            { userId: req.userId, status: 'pending' } // User sees own pending comments
        ];
        // Context-based filtering
        if (exerciseId)
            query.exerciseId = exerciseId;
        if (marathonId)
            query.marathonId = marathonId;
        if (marathonDayNumber)
            query.marathonDayNumber = Number(marathonDayNumber);
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
        // Custom sorting: starred first, then admin responses to current user, then by date
        const comments = await Comment_model_1.default.find(query)
            .populate('userId', 'firstName lastName')
            .populate('adminResponseId')
            .lean();
        // Sort comments: starred first, then admin replies to this user, then everything else by date
        const sortedComments = comments.sort((a, b) => {
            // Starred comments always first
            if (a.starred && !b.starred)
                return -1;
            if (!a.starred && b.starred)
                return 1;
            // If both starred or both not starred, check if admin replied to current user
            const aHasAdminReply = a.adminResponseId && a.userId.toString() === req.userId;
            const bHasAdminReply = b.adminResponseId && b.userId.toString() === req.userId;
            if (aHasAdminReply && !bHasAdminReply)
                return -1;
            if (!aHasAdminReply && bHasAdminReply)
                return 1;
            // Otherwise sort by date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        // Apply pagination after sorting
        const paginatedComments = sortedComments.slice(skip, skip + Number(limit));
        // Get replies for each comment
        const commentsWithReplies = await Promise.all(paginatedComments.map(async (comment) => {
            const replies = await Comment_model_1.default.find({
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
        }));
        const total = comments.length;
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
    }
    catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create comment
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { exerciseId, marathonId, marathonDayNumber, content, isPrivate = false, parentCommentId } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }
        if (content.length > 5000) {
            return res.status(400).json({ success: false, error: 'Content too long (max 5000 characters)' });
        }
        const comment = new Comment_model_1.default({
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
        const populatedComment = await Comment_model_1.default.findById(comment._id)
            .populate('userId', 'firstName lastName')
            .lean();
        res.json({
            success: true,
            data: populatedComment,
            message: isPrivate
                ? 'Личное сообщение отправлено тренеру'
                : 'Комментарий отправлен на модерацию'
        });
    }
    catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update own comment
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const comment = await Comment_model_1.default.findOne({ _id: id, userId: req.userId });
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
    }
    catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Delete own comment
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await Comment_model_1.default.findOne({ _id: id, userId: req.userId });
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found or unauthorized' });
        }
        await comment.deleteOne();
        res.json({ success: true, message: 'Comment deleted' });
    }
    catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Like comment
router.post('/:id/like', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await Comment_model_1.default.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }
        res.json({ success: true, data: comment });
    }
    catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
