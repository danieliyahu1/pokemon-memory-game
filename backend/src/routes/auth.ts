import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const router = Router();

interface SignupBody {
  username: string;
  password: string;
}

interface LoginBody {
  username: string;
  password: string;
}

interface AuthResponse {
  token?: string;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

// Signup route
router.post('/signup', async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { username, password } = req.body as SignupBody;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const user = new User({ username, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: String(user._id), username: user.username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { username, password } = req.body as LoginBody;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: String(user._id), username: user.username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
