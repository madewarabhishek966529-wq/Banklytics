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
      // For simplified local analysis: automatically allow local user
      req.user = DEFAULT_USER;
      return next();
    }

    const secret = process.env.JWT_SECRET || 'banklytics_super_secret_jwt_key_2026_dev_secure_change_in_production';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      req.user = DEFAULT_USER;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // If token is invalid or expired, gracefully fall back to local user for simple analysis
    req.user = DEFAULT_USER;
    next();
  }
}
