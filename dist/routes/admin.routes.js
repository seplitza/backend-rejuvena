"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_model_1 = __importDefault(require("../models/User.model"));
const UserNote_model_1 = __importDefault(require("../models/UserNote.model"));
const UserBadge_model_1 = __importDefault(require("../models/UserBadge.model"));
const Payment_model_1 = __importDefault(require("../models/Payment.model"));
const MarathonEnrollment_model_1 = __importDefault(require("../models/MarathonEnrollment.model"));
const MarathonExerciseProgress_model_1 = __importDefault(require("../models/MarathonExerciseProgress.model"));
const ExercisePurchase_model_1 = __importDefault(require("../models/ExercisePurchase.model"));
const Order_model_1 = __importDefault(require("../models/Order.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// Get all users with extended info (CRM list)
router.get('/users', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { search, isPremium, hasMarathons, hasPurchases, contactsEnabled, tags, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50 } = req.query;
        // Build filter
        const filter = {};
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        if (isPremium !== undefined) {
            filter.isPremium = isPremium === 'true';
        }
        if (contactsEnabled !== undefined) {
            filter.contactsEnabled = contactsEnabled === 'true';
        }
        if (tags && tags !== 'all') {
            filter.tags = { $in: [tags] }; // Проверка что массив tags содержит указанный тег
        }
        // Get users
        const skip = (Number(page) - 1) * Number(limit);
        const users = await User_model_1.default.find(filter)
            .select('-password')
            .sort({ [String(sortBy)]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const total = await User_model_1.default.countDocuments(filter);
        // Enrich with stats
        const enrichedUsers = await Promise.all(users.map(async (user) => {
            const userId = user._id;
            const objectId = new mongoose_1.default.Types.ObjectId(user._id.toString());
            // Payments stats
            const payments = await Payment_model_1.default.find({ userId, status: 'succeeded' }).lean();
            const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
            const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;
            // Orders stats (магазин)
            const orders = await Order_model_1.default.find({ userId: objectId }).lean();
            const paidOrders = orders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'completed');
            const totalOrdersAmount = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null;
            // Marathon enrollments
            const enrollments = await MarathonEnrollment_model_1.default.find({ userId }).lean();
            const activeMarathons = enrollments.filter(e => e.status === 'active').length;
            const completedMarathons = enrollments.filter(e => e.status === 'completed').length;
            // Exercise progress
            const exerciseProgress = await MarathonExerciseProgress_model_1.default.find({ userId }).lean();
            const completedExercises = exerciseProgress.filter(e => e.isCompleted).length;
            const totalExercises = exerciseProgress.length;
            const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
            // Exercise purchases
            const exercisePurchases = await ExercisePurchase_model_1.default.find({ userId }).lean();
            // Notes count
            const notesCount = await UserNote_model_1.default.countDocuments({ userId });
            // Badges
            const badges = await UserBadge_model_1.default.find({ userId }).lean();
            // Premium days left
            let premiumDaysLeft = 0;
            if (user.isPremium && user.premiumEndDate) {
                const daysLeft = Math.ceil((new Date(user.premiumEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                premiumDaysLeft = Math.max(0, daysLeft);
            }
            return {
                ...user,
                stats: {
                    totalPayments: payments.length,
                    totalSpent,
                    lastPaymentDate: lastPayment?.createdAt,
                    lastPaymentAmount: lastPayment?.amount,
                    totalOrders: orders.length,
                    totalOrdersAmount,
                    paidOrders: paidOrders.length,
                    lastOrderDate: lastOrder?.createdAt,
                    activeMarathons,
                    completedMarathons,
                    totalMarathons: enrollments.length,
                    completedExercises,
                    totalExercises,
                    completionRate,
                    exercisePurchases: exercisePurchases.length,
                    notesCount,
                    badgesCount: badges.length,
                    premiumDaysLeft
                }
            };
        }));
        // Apply additional filters if needed
        let filteredUsers = enrichedUsers;
        if (hasMarathons === 'true') {
            filteredUsers = filteredUsers.filter(u => u.stats.totalMarathons > 0);
        }
        if (hasPurchases === 'true') {
            filteredUsers = filteredUsers.filter(u => u.stats.totalPayments > 0);
        }
        res.json({
            success: true,
            users: filteredUsers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get user details
router.get('/users/:id/details', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_model_1.default.findById(id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Convert id to ObjectId for querying
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        // Get all related data
        const [payments, enrollments, exerciseProgress, exercisePurchases, notes, badges, orders] = await Promise.all([
            Payment_model_1.default.find({ userId: objectId }).sort({ createdAt: -1 }).lean(),
            MarathonEnrollment_model_1.default.find({ userId: objectId }).populate('marathonId', 'title numberOfDays').sort({ enrolledAt: -1 }).lean(),
            MarathonExerciseProgress_model_1.default.find({ userId: objectId }).populate('exerciseId', 'title').lean(),
            ExercisePurchase_model_1.default.find({ userId: objectId }).sort({ purchaseDate: -1 }).lean(),
            UserNote_model_1.default.find({ userId: objectId }).populate('adminId', 'firstName lastName email').sort({ createdAt: -1 }).lean(),
            UserBadge_model_1.default.find({ userId: objectId }).sort({ earnedAt: -1 }).lean(),
            Order_model_1.default.find({ userId: objectId }).sort({ createdAt: -1 }).lean()
        ]);
        // Calculate completion rates per marathon
        const marathonStats = await Promise.all(enrollments.map(async (enrollment) => {
            const marathonProgress = await MarathonExerciseProgress_model_1.default.find({
                userId: objectId,
                marathonId: enrollment.marathonId
            }).lean();
            const completed = marathonProgress.filter(p => p.isCompleted).length;
            const total = marathonProgress.length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
                ...enrollment,
                completedExercises: completed,
                totalExercises: total,
                completionRate: rate
            };
        }));
        res.json({
            success: true,
            data: {
                user,
                payments,
                marathons: marathonStats,
                exercisePurchases,
                notes,
                badges,
                orders,
                summary: {
                    totalSpent: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0),
                    totalPayments: payments.length,
                    successfulPayments: payments.filter(p => p.status === 'succeeded').length,
                    activeMarathons: enrollments.filter(e => e.status === 'active').length,
                    completedMarathons: enrollments.filter(e => e.status === 'completed').length,
                    totalExercises: exerciseProgress.length,
                    completedExercises: exerciseProgress.filter(e => e.isCompleted).length,
                    totalOrders: orders.length,
                    totalOrdersAmount: orders.reduce((sum, o) => sum + (o.total || 0), 0),
                    paidOrders: orders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'completed').length
                }
            }
        });
    }
    catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Add note to user
router.post('/users/:id/notes', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type = 'note', metadata } = req.body;
        const user = await User_model_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const note = new UserNote_model_1.default({
            userId: id,
            adminId: req.userId,
            content,
            type,
            metadata
        });
        await note.save();
        const populatedNote = await UserNote_model_1.default.findById(note._id)
            .populate('adminId', 'firstName lastName email')
            .lean();
        res.json({ success: true, data: populatedNote });
    }
    catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get user notes
router.get('/users/:id/notes', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const notes = await UserNote_model_1.default.find({ userId: id })
            .populate('adminId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, notes });
    }
    catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Toggle contacts enabled
router.put('/users/:id/contacts', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;
        const user = await User_model_1.default.findByIdAndUpdate(id, { contactsEnabled: enabled }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Toggle contacts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update personal discount
router.put('/users/:id/discount', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { personalDiscount, personalDiscountExpiry } = req.body;
        const updateData = {};
        // Set discount (null to remove)
        if (personalDiscount !== undefined) {
            if (personalDiscount === null || personalDiscount <= 0) {
                updateData.personalDiscount = undefined;
                updateData.personalDiscountExpiry = undefined;
            }
            else {
                // Validate discount range
                const discount = Math.min(100, Math.max(0, personalDiscount));
                updateData.personalDiscount = discount;
                // Set expiry if provided
                if (personalDiscountExpiry) {
                    updateData.personalDiscountExpiry = new Date(personalDiscountExpiry);
                }
                else {
                    updateData.personalDiscountExpiry = undefined;
                }
            }
        }
        const user = await User_model_1.default.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Update discount error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Add badge to user
router.post('/users/:id/badges', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { badgeType, title, description, icon, color, metadata } = req.body;
        const user = await User_model_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Check if badge already exists (except custom)
        if (badgeType !== 'custom') {
            const existingBadge = await UserBadge_model_1.default.findOne({ userId: id, badgeType });
            if (existingBadge) {
                return res.status(400).json({ success: false, error: 'Badge already exists' });
            }
        }
        const badge = new UserBadge_model_1.default({
            userId: id,
            badgeType,
            title,
            description,
            icon,
            color,
            metadata
        });
        await badge.save();
        res.json({ success: true, data: badge });
    }
    catch (error) {
        console.error('Add badge error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get dashboard stats
router.get('/users/stats/dashboard', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const [totalUsers, premiumUsers, activeUsers, newUsersThisMonth, totalPayments, totalRevenue, activeMarathons] = await Promise.all([
            User_model_1.default.countDocuments(),
            User_model_1.default.countDocuments({ isPremium: true }),
            User_model_1.default.countDocuments({ lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
            User_model_1.default.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
            Payment_model_1.default.countDocuments({ status: 'succeeded' }),
            Payment_model_1.default.aggregate([
                { $match: { status: 'succeeded' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            MarathonEnrollment_model_1.default.countDocuments({ status: 'active' })
        ]);
        // Top users by completion rate
        const allEnrollments = await MarathonEnrollment_model_1.default.find().populate('userId', 'firstName lastName email').lean();
        const userCompletionRates = await Promise.all(allEnrollments.map(async (enrollment) => {
            const progress = await MarathonExerciseProgress_model_1.default.find({
                userId: enrollment.userId,
                marathonId: enrollment.marathonId
            }).lean();
            const completed = progress.filter(p => p.isCompleted).length;
            const total = progress.length;
            const rate = total > 0 ? (completed / total) * 100 : 0;
            return {
                userId: enrollment.userId,
                rate,
                completed,
                total
            };
        }));
        // Group by user and average
        const userRatesMap = new Map();
        userCompletionRates.forEach(({ userId, rate, completed, total }) => {
            if (!userRatesMap.has(userId._id.toString())) {
                userRatesMap.set(userId._id.toString(), {
                    user: userId,
                    rates: [],
                    totalCompleted: 0,
                    totalExercises: 0
                });
            }
            const entry = userRatesMap.get(userId._id.toString());
            entry.rates.push(rate);
            entry.totalCompleted += completed;
            entry.totalExercises += total;
        });
        const topUsers = Array.from(userRatesMap.values())
            .map(({ user, rates, totalCompleted, totalExercises }) => ({
            user,
            averageRate: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
            totalCompleted,
            totalExercises
        }))
            .sort((a, b) => b.averageRate - a.averageRate)
            .slice(0, 10);
        res.json({
            success: true,
            data: {
                totalUsers,
                premiumUsers,
                activeUsers,
                newUsersThisMonth,
                totalPayments,
                totalRevenue: totalRevenue[0]?.total || 0,
                activeMarathons,
                topUsers
            }
        });
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
