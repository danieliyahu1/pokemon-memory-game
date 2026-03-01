import { Router, Request, Response } from 'express';
import User from '../models/User';
import { verifyToken } from '../middleware/auth';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

interface UserSearchResponse {
  users?: Array<{
    id: string;
    username: string;
    online?: boolean;
  }>;
  error?: string;
}

// Search for online authenticated users
router.get('/search', verifyToken, async (req: AuthRequest, res: Response<UserSearchResponse>) => {
  try {
    const { username } = req.query as { username?: string };

    if (!username) {
      return res.status(400).json({ error: 'Username query parameter is required' });
    }

    // Search for users by username (case-insensitive)
    const users = await User.find({
      username: { $regex: username, $options: 'i' }
    }).select('_id username');

    return res.status(200).json({
      users: users.map(user => ({
        id: String(user._id),
        username: user.username,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
