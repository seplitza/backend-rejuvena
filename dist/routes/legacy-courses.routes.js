"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const legacyCoursesService = __importStar(require("../services/legacy-courses.service"));
const router = (0, express_1.Router)();
/**
 * GET /api/legacy/courses/my-orders
 * Получить список курсов пользователя
 */
router.get('/my-orders', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await legacyCoursesService.getMyOrders(userId);
        res.json({ success: true, orders });
    }
    catch (error) {
        console.error('Error fetching my orders:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch orders'
        });
    }
});
/**
 * GET /api/legacy/courses/available
 * Получить список доступных курсов
 */
router.get('/available', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const courses = await legacyCoursesService.getAvailableCourses(userId);
        res.json({ success: true, courses });
    }
    catch (error) {
        console.error('Error fetching available courses:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch available courses'
        });
    }
});
/**
 * GET /api/legacy/courses/demos
 * Получить список демо-курсов
 */
router.get('/demos', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const demos = await legacyCoursesService.getDemoCourses(userId);
        res.json({ success: true, demos });
    }
    catch (error) {
        console.error('Error fetching demo courses:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch demo courses'
        });
    }
});
/**
 * GET /api/legacy/courses/marathon/:id/start
 * Начать марафон (получить данные марафона)
 */
router.get('/marathon/:id/start', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const marathonData = await legacyCoursesService.startMarathon(userId, id);
        res.json({ success: true, data: marathonData });
    }
    catch (error) {
        console.error('Error starting marathon:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to start marathon'
        });
    }
});
/**
 * GET /api/legacy/courses/marathon/:id/day/:dayId
 * Получить упражнения дня марафона
 */
router.get('/marathon/:id/day/:dayId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id, dayId } = req.params;
        const dayExercises = await legacyCoursesService.getDayExercises(userId, id, parseInt(dayId));
        res.json({ success: true, exercises: dayExercises });
    }
    catch (error) {
        console.error('Error fetching day exercises:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch day exercises'
        });
    }
});
/**
 * POST /api/legacy/courses/marathon/:id/accept-terms
 * Принять условия марафона
 */
router.post('/marathon/:id/accept-terms', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        await legacyCoursesService.acceptMarathonTerms(userId, id);
        res.json({ success: true, message: 'Terms accepted' });
    }
    catch (error) {
        console.error('Error accepting terms:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to accept terms'
        });
    }
});
/**
 * POST /api/legacy/courses/marathon/:id/day/:dayId/exercise/:exerciseId/status
 * Обновить статус упражнения (отметить как выполненное)
 */
router.post('/marathon/:id/day/:dayId/exercise/:exerciseId/status', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id, dayId, exerciseId } = req.params;
        const { status } = req.body;
        await legacyCoursesService.setExerciseStatus(userId, id, parseInt(dayId), parseInt(exerciseId), status || 'complete');
        res.json({ success: true, message: 'Exercise status updated' });
    }
    catch (error) {
        console.error('Error updating exercise status:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update exercise status'
        });
    }
});
/**
 * POST /api/legacy/courses/order
 * Создать заказ курса
 */
router.post('/order', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { MarathonId } = req.body;
        if (!MarathonId) {
            return res.status(400).json({
                success: false,
                message: 'MarathonId is required'
            });
        }
        const order = await legacyCoursesService.createOrder(userId, MarathonId);
        res.json({ success: true, order });
    }
    catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order'
        });
    }
});
exports.default = router;
