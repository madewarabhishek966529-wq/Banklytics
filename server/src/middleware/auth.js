import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const DEFAULT_USER = {
  _id: 'default_local_user_1',
  name: 'Local User',
  email: 'user@banklytics.local',
};

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is missing. Please log in.',
        },
      });
    }

    const secret = process.env.JWT_SECRET || 'banklytics_super_secret_jwt_key_2026_dev_secure_change_in_production';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this token no longer exists.',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token. Please log in again.',
      },
    });
  }
}
