import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
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

// Login with Azure fallback (Unified Auth)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Step 1: Try local database first
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists locally - validate password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Local user authenticated:', email);
    } else {
      // Step 2: User not found locally - try Azure API (legacy users)
      console.log('🔄 User not found locally, trying Azure fallback:', email);
      
      try {
        const azureLoginResponse = await fetch(
          'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api/auth/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          }
        );

        if (!azureLoginResponse.ok) {
          // Azure also failed - invalid credentials
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const azureData = await azureLoginResponse.json();
        console.log('✅ Azure authentication successful, creating local user:', email);

        // Step 3: Create user locally from Azure data
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          email,
          password: hashedPassword,
          role: 'admin',
          isPremium: azureData.isPremium || false,
          premiumEndDate: azureData.premiumEndDate,
          isLegacyUser: true,
          azureUserId: azureData.id || azureData.userId
        });
        await user.save();
        console.log('✅ Legacy user created in local database');
        
      } catch (azureError) {
        console.error('❌ Azure API error:', azureError);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Generate JWT token (same for both local and legacy users)
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
        isPremium: user.isPremium,
        isLegacyUser: user.isLegacyUser
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
