"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ExercisePurchase_model_1 = __importDefault(require("../models/ExercisePurchase.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const router = (0, express_1.Router)();
// Получить список купленных упражнений
router.get('/my-purchases', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const purchases = await ExercisePurchase_model_1.default.find({
            userId,
            expiresAt: { $gt: new Date() }
        }).sort({ purchaseDate: -1 });
        res.json({
            purchases: purchases.map(p => ({
                id: p._id,
                exerciseId: p.exerciseId,
                exerciseName: p.exerciseName,
                price: p.price,
                purchaseDate: p.purchaseDate,
                expiresAt: p.expiresAt
            }))
        });
    }
    catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Проверка доступа к упражнению
router.get('/has-access/:exerciseId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const userId = req.userId;
        const user = await User_model_1.default.findById(userId);
        // Если премиум - доступ ко всему
        if (user?.isPremium && user.premiumEndDate && user.premiumEndDate > new Date()) {
            return res.json({ hasAccess: true, reason: 'premium' });
        }
        // Проверяем покупку упражнения
        const purchase = await ExercisePurchase_model_1.default.findOne({
            userId,
            exerciseId,
            expiresAt: { $gt: new Date() }
        });
        if (purchase) {
            return res.json({ hasAccess: true, reason: 'purchased', expiresAt: purchase.expiresAt });
        }
        res.json({ hasAccess: false });
    }
    catch (error) {
        console.error('Check access error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
