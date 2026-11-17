import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { env } from '../config/env.js';

// Verifies the Bearer token and attaches the user to req.user.
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const { id, iat } = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'Not authenticated' });
    if (user.changedPasswordAfter(iat)) return res.status(401).json({ message: 'Password changed, please log in again' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};

// Usage: router.get('/x', protect, allowRoles('admin', 'staff'), handler)
export const allowRoles = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'You do not have access to this' });
};
