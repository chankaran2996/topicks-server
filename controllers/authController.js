import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { env } from '../config/env.js';
import { sendMail } from '../config/mailer.js';
import { resetPasswordEmail } from '../utils/emailTemplates.js';
import { recordLoginFailure, clearLoginFailures } from '../middleware/loginLimiter.js';

export const RESET_TTL_MINUTES = 30;
export const INVITE_TTL_HOURS = 48;
export const MIN_PASSWORD_LENGTH = 8;

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
export const setPasswordLink = (token) => `${env.clientUrl.replace(/\/$/, '')}/set-password?token=${token}`;

// POST /api/auth/login  { email, password }
export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  const ok = user && user.isActive && user.hasPassword && (await user.comparePassword(password));
  if (!ok) {
    recordLoginFailure(req);
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  clearLoginFailures(req);
  user.lastLoginAt = new Date();
  await user.save();

  res.json({ token: signToken(user), user: user.toSafeJSON() });
};

// GET /api/auth/me
export const me = (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
};

// POST /api/auth/forgot-password  { email }
// Always answers the same way so it can't be used to find out which emails exist.
export const forgotPassword = async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email, isActive: true });
  if (user) {
    const token = user.createPasswordToken(RESET_TTL_MINUTES);
    await user.save();
    try {
      await sendMail({ to: user.email, ...resetPasswordEmail(user.name, setPasswordLink(token), RESET_TTL_MINUTES) });
    } catch (err) {
      console.error('Failed to send reset email:', err.message);
      return res.status(500).json({ message: 'Could not send the email right now. Please try again later.' });
    }
  }

  res.json({ message: 'If an account exists for that email, a reset link is on its way.' });
};

// GET /api/auth/password-token/:token  → is the link still valid?
export const checkPasswordToken = async (req, res) => {
  const user = await User.findByPasswordToken(req.params.token);
  if (!user) return res.status(400).json({ message: 'This link is invalid or has expired.' });
  res.json({ email: user.email, name: user.name, isNewAccount: !user.hasPassword });
};

// POST /api/auth/set-password  { token, password }
export const setPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ message: 'Password must contain a letter and a number' });
  }

  const user = await User.findByPasswordToken(token);
  if (!user) return res.status(400).json({ message: 'This link is invalid or has expired.' });

  user.password = String(password);
  user.hasPassword = true;
  user.passwordTokenHash = undefined;
  user.passwordTokenExpires = undefined;
  await user.save(); // also logs out every existing session (passwordChangedAt)

  res.json({ message: 'Password updated. You can sign in now.' });
};
