import { Router } from 'express';
import { protect, allowRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Everything in this router requires an admin.
router.use(protect, allowRoles(ROLES.ADMIN));

router.get('/overview', (req, res) => {
  res.json({ message: `Welcome back, ${req.user.name}` });
});

export default router;
