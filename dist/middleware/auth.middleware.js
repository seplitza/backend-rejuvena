"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminOnly = exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        // Also set req.user for compatibility with shop routes
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (!req.userRole) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
const superAdminOnly = (req, res, next) => {
    if (req.userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Superadmin only.' });
    }
    next();
};
exports.superAdminOnly = superAdminOnly;
