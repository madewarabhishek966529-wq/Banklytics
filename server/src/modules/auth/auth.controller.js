import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../../models/User.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function signToken(userId) {
  const secret = process.env.JWT_SECRET || 'banklytics_super_secret_jwt_key_2026_dev_secure_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
}

function setCookieToken(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: validated.email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists',
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await User.create({
      name: validated.name.trim(),
      email: validated.email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user._id);
    setCookieToken(res, token);

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const isMatch = await user.comparePassword(validated.password);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const token = signToken(user._id);
    setCookieToken(res, token);

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export function getMe(req, res) {
  return res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
}
