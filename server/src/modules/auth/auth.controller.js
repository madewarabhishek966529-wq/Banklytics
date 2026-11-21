import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../../models/User.js';
import { Statement } from '../../models/Statement.js';
import { Transaction } from '../../models/Transaction.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
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

export async function changePassword(req, res, next) {
  try {
    const validated = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found',
        },
      });
    }

    const isMatch = await user.comparePassword(validated.currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Current password does not match',
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.newPassword, salt);
    await User.updateOne({ _id: user._id }, { passwordHash });

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user._id;

    // Cascade delete user data
    await Transaction.deleteMany({ userId });
    await Statement.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    res.clearCookie('token');
    return res.json({
      success: true,
      message: 'Account and all associated financial records permanently deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function loginDemo(req, res, next) {
  try {
    const demoEmail = 'demo@banklytics.local';
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('DemoUser@2026', salt);
      demoUser = await User.create({
        name: 'Banklytics Demo User',
        email: demoEmail,
        passwordHash,
      });
    }

    const token = signToken(demoUser._id);
    setCookieToken(res, token);

    return res.json({
      success: true,
      user: {
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        createdAt: demoUser.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}
