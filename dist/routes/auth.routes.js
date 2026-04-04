"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const email_service_1 = __importDefault(require("../services/email.service"));
const router = (0, express_1.Router)();
// Register new user (with email notification)
router.post('/register', async (req, res) => {
    try {
        const { email, firstName, lastName, telegramUsername } = req.body;
        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase().trim();
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        // Check if user already exists
        const existingUser = await User_model_1.default.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Generate random 4-digit password
        const generatedPassword = email_service_1.default.generatePassword();
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(generatedPassword, 10);
        // Create new user
        const user = new User_model_1.default({
            email: normalizedEmail,
            password: hashedPassword,
            firstName: firstName?.trim() || '',
            lastName: lastName?.trim() || '',
            telegramUsername: telegramUsername?.trim().replace(/^@/, '') || undefined,
            role: 'admin',
            isPremium: false
        });
        await user.save();
        console.log(`✅ User registered: ${normalizedEmail}`);
        // Send registration email with password
        const emailSent = await email_service_1.default.sendRegistrationEmail(normalizedEmail, generatedPassword);
        if (!emailSent) {
            console.warn(`⚠️ Email not sent to ${normalizedEmail}, but user created`);
        }
        // Generate token for immediate login
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(201).json({
            message: emailSent
                ? 'Registration successful! Check your email for login credentials.'
                : 'Registration successful! Please contact support for login credentials.',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isPremium: false,
                createdAt: user.createdAt,
                firstPhotoDiaryUpload: user.firstPhotoDiaryUpload
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Login (Simple - Local DB only)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase().trim();
        // Find user in local database
        const user = await User_model_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isPremium: user.isPremium || false,
                premiumEndDate: user.premiumEndDate,
                createdAt: user.createdAt,
                firstPhotoDiaryUpload: user.firstPhotoDiaryUpload,
                isLegacyUser: user.isLegacyUser || false
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get current user// Get current user
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_model_1.default.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update profile
router.put('/update-profile', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, telegramUsername } = req.body;
        const user = await User_model_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update fields if provided
        if (firstName !== undefined)
            user.firstName = firstName.trim();
        if (lastName !== undefined)
            user.lastName = lastName.trim();
        if (telegramUsername !== undefined) {
            // Remove @ symbol if present and trim
            const cleanUsername = telegramUsername.trim().replace(/^@/, '');
            user.telegramUsername = cleanUsername || undefined;
        }
        await user.save();
        // Return updated user without password
        const updatedUser = await User_model_1.default.findById(req.userId).select('-password');
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Change password
router.post('/change-password', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ message: 'New password must be at least 4 characters' });
        }
        const user = await User_model_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Verify current password
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        // Hash and save new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Reset password - generate new password and send via email
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const user = await User_model_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Не раскрываем существование пользователя в целях безопасности
            return res.json({ message: 'If account exists, password reset email has been sent' });
        }
        // Генерируем новый 4-значный пароль
        const newPassword = Math.floor(1000 + Math.random() * 9000).toString();
        // Хешируем и сохраняем
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        // Отправляем email с новым паролем
        const emailService = require('../services/email.service').default;
        await emailService.sendPasswordResetEmail(user.email, newPassword);
        console.log(`✅ Password reset for ${user.email}, new password sent via email`);
        res.json({ message: 'If account exists, password reset email has been sent' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Quick registration from landing page (email only)
router.post('/register-and-pay', async (req, res) => {
    try {
        const { email, firstName, lastName, telegramNick } = req.body;
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ success: false, error: 'Неверный формат email' });
        }
        // Check if user already exists
        let existingUser = await User_model_1.default.findOne({ email: normalizedEmail });
        if (existingUser) {
            // User exists - just return token
            const token = jsonwebtoken_1.default.sign({ userId: existingUser._id, role: existingUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
            return res.json({
                success: true,
                token,
                message: 'Пользователь уже существует, выполнен вход',
                existingUser: true
            });
        }
        // Generate random 4-digit password
        const generatedPassword = email_service_1.default.generatePassword();
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(generatedPassword, 10);
        // Create new user
        const user = new User_model_1.default({
            email: normalizedEmail,
            password: hashedPassword,
            firstName: firstName?.trim() || undefined,
            lastName: lastName?.trim() || undefined,
            telegramUsername: telegramNick?.trim() || undefined,
            role: 'admin', // Default role
            isPremium: false
        });
        await user.save();
        console.log(`✅ Quick registration from landing: ${normalizedEmail}`);
        // Send registration email with password
        await email_service_1.default.sendRegistrationEmail(normalizedEmail, generatedPassword);
        // Generate token for immediate login
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            password: generatedPassword,
            message: 'Регистрация успешна! Пароль отправлен на email',
            existingUser: false
        });
    }
    catch (error) {
        console.error('Quick registration error:', error);
        res.status(500).json({ success: false, error: 'Ошибка регистрации' });
    }
});
// Guest login endpoint (for old app compatibility - no auth needed)
// GET /token/GuestUserLogin?deviceId=...
router.get('/GuestUserLogin', async (req, res) => {
    try {
        const { deviceId } = req.query;
        // Generate guest token (optional - for compatibility)
        const guestToken = jsonwebtoken_1.default.sign({ guest: true, deviceId }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        res.json({
            token: guestToken,
            isGuest: true,
            deviceId
        });
    }
    catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
