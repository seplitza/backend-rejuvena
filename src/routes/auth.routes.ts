import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
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
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
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

// Endpoint для обмена старого токена на новый
router.post('/exchange-token', async (req: Request, res: Response) => {
  try {
    const oldToken = req.headers.authorization?.split(' ')[1];
    
    if (!oldToken) {
      return res.status(401).json({ error: 'Old token required' });
    }

    // Проверяем старый токен через старый API
    const oldApiResponse = await fetch('https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/user/getuserprofiledetail', {
      headers: {
        'Authorization': `Bearer ${oldToken}`
      }
    });

    if (!oldApiResponse.ok) {
      return res.status(401).json({ error: 'Invalid old token' });
    }

    const userData = await oldApiResponse.json();
    
    // Находим или создаем пользователя в новой БД
    let user = await User.findOne({ email: userData.email });
    
    if (!user) {
      // Создаем пользователя из данных старого API
      user = new User({
        email: userData.email,
        firstName: userData.firstName || userData.fullName?.split(' ')[0],
        las        las        las        las        las        las      
        passwordHash: 'impo        m_old_system', // Не используется
        isPremium:         isPremium:         isPremium:         isPremium:         isPremium: 
                  ait user.save();
    }

    // Создаем новый токен для нового API
    const newToken = jwt.sign(
                   r._id, role: user.role || 'user' },
      process.env.JWT_SECRET     secret',
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

