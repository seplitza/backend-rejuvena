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
    const { email } = req.body;
    
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
        role: user.role
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
        role: user.role,
        isPremium: user.isPremium || false,
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

export default router;
