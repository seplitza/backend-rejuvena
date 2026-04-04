"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public endpoints - no auth required
// Get all published exercises (for frontend app)
router.get('/public', async (req, res) => {
    try {
        const exercises = await Exercise_model_1.default.find({ isPublished: true })
            .populate('tags')
            .select('-__v')
            .sort({ updatedAt: -1 });
        res.json(exercises);
    }
    catch (error) {
        console.error('Get public exercises error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get single published exercise by ID (for frontend app)
router.get('/public/:id', async (req, res) => {
    try {
        const exercise = await Exercise_model_1.default.findOne({
            _id: req.params.id,
            isPublished: true
        }).populate('tags').select('-__v');
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json(exercise);
    }
    catch (error) {
        console.error('Get public exercise error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Admin endpoints - auth required
// Get all exercises
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const exercises = await Exercise_model_1.default.find()
            .populate('tags')
            .sort({ updatedAt: -1 });
        res.json(exercises);
    }
    catch (error) {
        console.error('Get exercises error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get single exercise
router.get('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const exercise = await Exercise_model_1.default.findById(req.params.id).populate('tags');
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json(exercise);
    }
    catch (error) {
        console.error('Get exercise error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Create exercise
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const exercise = new Exercise_model_1.default(req.body);
        await exercise.save();
        await exercise.populate('tags');
        res.status(201).json(exercise);
    }
    catch (error) {
        console.error('Create exercise error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update exercise
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const exercise = await Exercise_model_1.default.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true }).populate('tags');
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json(exercise);
    }
    catch (error) {
        console.error('Update exercise error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete exercise
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const exercise = await Exercise_model_1.default.findByIdAndDelete(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json({ message: 'Exercise deleted successfully' });
    }
    catch (error) {
        console.error('Delete exercise error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update carousel media order
router.put('/:id/carousel/reorder', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { mediaOrder } = req.body; // Array of media IDs in new order
        const exercise = await Exercise_model_1.default.findById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        // Reorder carousel media
        const reorderedMedia = mediaOrder.map((id, index) => {
            const media = exercise.carouselMedia.find(m => m._id?.toString() === id);
            if (media) {
                media.order = index;
                return media;
            }
            return null;
        }).filter(Boolean);
        exercise.carouselMedia = reorderedMedia;
        await exercise.save();
        res.json(exercise);
    }
    catch (error) {
        console.error('Reorder media error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
