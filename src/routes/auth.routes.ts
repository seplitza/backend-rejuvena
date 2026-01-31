import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import emailService from '../services/email.service';

const router = Router();

// Register new user (with email notification)
router.post('/register', async (req: Request, res: Response) => {
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
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate random 4-digit password
    const generatedPassword = emailService.generatePassword();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create new user
    const user = new User({
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
    const emailSent = await emailService.sendRegistrationEmail(normalizedEmail, generatedPassword);
    
    if (!emailSent) {
      console.warn(`⚠️ Email not sent to ${normalizedEmail}, but user created`);
    }

    // Generate token for immediate login
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (Simple - Local DB only)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim();

    // Find user in local database
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/update-profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, telegramUsername } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (telegramUsername !== undefined) {
      // Remove @ symbol if present and trim
      const cleanUsername = telegramUsername.trim().replace(/^@/, '');
      user.telegramUsername = cleanUsername || undefined;
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.userId).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password - generate new password and send via email
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Не раскрываем существование пользователя в целях безопасности
      return res.json({ message: 'If account exists, password reset email has been sent' });
    }

    // Генерируем новый 4-значный пароль
    const newPassword = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Хешируем и сохраняем
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Отправляем email с новым паролем
    const emailService = require('../services/email.service').default;
    await emailService.sendPasswordResetEmail(user.email, newPassword);

    console.log(`✅ Password reset for ${user.email}, new password sent via email`);
    res.json({ message: 'If account exists, password reset email has been sent' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
