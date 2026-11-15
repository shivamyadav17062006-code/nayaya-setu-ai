import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

/**
 * Helper to strip password and sensitive fields from user object
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

/**
 * POST /api/auth/register
 */
export async function registerUser(req, res, next) {
  try {
    if (!isPrismaConfigured) {
      return next(createError('Database connection unavailable for registration.', 503, 'DB_UNAVAILABLE'));
    }

    const { email, phone, password, name, state, language = 'en' } = req.body;
    const cleanEmail = email && email.trim() !== '' ? email.toLowerCase().trim() : null;
    const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: cleanEmail && existingUser.email === cleanEmail
          ? 'An account with this email address already exists.'
          : 'An account with this phone number already exists.',
        code: 'USER_ALREADY_EXISTS',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        name: name?.trim() || null,
        state: state?.trim() || null,
        language,
        role: 'USER',
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function loginUser(req, res, next) {
  try {
    if (!isPrismaConfigured) {
      return next(createError('Database connection unavailable for authentication.', 503, 'DB_UNAVAILABLE'));
    }

    const { email, phone, password } = req.body;
    const cleanEmail = email && email.trim() !== '' ? email.toLowerCase().trim() : null;
    const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/phone or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/phone or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Retrieves the authenticated user's profile.
 */
export async function getCurrentUser(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        state: true,
        language: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/profile
 * Allows citizen to update their name, state of residence, and preferred language.
 */
export async function updateProfile(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { name, state, language } = req.body;
    const updateData = {};
    if (typeof name === 'string') updateData.name = name.trim();
    if (typeof state === 'string') updateData.state = state.trim();
    if (typeof language === 'string') updateData.language = language.trim().toLowerCase();

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        state: true,
        language: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Acknowledges user logout. Since JWT is stateless, client clears token from storage.
 */
export async function logoutUser(_req, res) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your local session token.',
  });
}
