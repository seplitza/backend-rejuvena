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

    // Step 1: Try to find user in local database
    let user = await User.findOne({ email });
    
    if (user) {
      // Local user exists - verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Step 2: User not found locally - try Azure API (legacy users)
      console.log('🔄 User not found locally, checking Azure API...');
      
      try {
        console.log('📡 Calling Azure API with email:', email);
        const azureResponse = await fetch(
          'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api/auth/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          }
        );

        console.log('📡 Azure API response status:', azureResponse.status);
        
        if (!azureResponse.ok) {
          const errorText = await azureResponse.text();
          console.error('❌ Azure login failed:', azureResponse.status, errorText);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const azureData = await azureResponse.json() as any;
        console.log('✅ Azure login successful:', JSON.stringify(azureData, null, 2));
        console.log('✅ Creating local user...');

        // Step 3: Create local user from Azure data
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          email: email,
          password: hashedPassword,
          role: 'admin',
          isPremium: azureData.user?.isPremium || false,
          premiumEndDate: azureData.user?.premiumEndDate,
          isLegacyUser: true,
          azureUserId: azureData.user?.id
        });
        await user.save();
        console.log('✅ Legacy user imported:', email);
        
      } catch (azureError: any) {
        console.error('❌ Azure API error:', azureError.message);
        console.error('❌ Full error:', azureError);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Step 4: Generate JWT token for local system
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
