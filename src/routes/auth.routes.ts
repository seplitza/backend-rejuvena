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

// Login
router.post('/login', async (req: Request, res: Response) => {
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

// Exchange old Azure token for new DuckDNS token
router.post('/exchange-token', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Token exchange request received');
    const oldToken = req.headers.authorization?.split(' ')[1];
    
    if (!oldToken) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Old token required' });
    }

    console.log('🔑 Old token length:', oldToken.length);

    // Verify old token with Azure API
    console.log('📡 Calling Azure API...');
    const oldApiResponse = await fetch('https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api/user/getuserprofiledetail', {
      headers: {
        'Authorization': `Bearer ${oldToken}`
      }
    });

    console.log('📡 Azure API response status:', oldApiResponse.status);

    if (!oldApiResponse.ok) {
      const errorText = await oldApiResponse.text();
      console.log('❌ Azure API error:', errorText);
      return res.status(401).json({ error: 'Invalid old token', details: errorText });
    }

    const userData = await oldApiResponse.json() as any;
    console.log('✅ User data from Azure:', { email: userData.email, isPremium: userData.isPremium });
    
    // Find or create user in new database
    let user = await User.findOne({ email: userData.email });
    
    if (!user) {
      console.log('📝 Creating new user:', userData.email);
      // Create user from Azure data
      user = new User({
        email: userData.email,
        password: 'imported_from_azure_no_password',
        role: 'admin',
        isPremium: userData.isPremium || false,
        premiumEndDate: userData.premiumEndDate
      });
      await user.save();
      console.log('✅ User created');
    } else {
      console.log('✅ User found:', user.email);
    }

    // Create new token for DuckDNS API
    const newToken = jwt.sign(
      { userId: user._id, role: user.role || 'user' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    console.log('✅ Token exchange successful');
    res.json({ 
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('❌ Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

export default router;
