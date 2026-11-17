import { Router } from 'express';
import { login, me, forgotPassword, checkPasswordToken, setPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter, forgotLimiter } from '../middleware/loginLimiter.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.get('/me', protect, me);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.get('/password-token/:token', checkPasswordToken);
router.post('/set-password', setPassword);

export default router;
