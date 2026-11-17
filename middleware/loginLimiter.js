// Small in-memory rate limiters keyed by IP + email.
const createLimiter = ({ max, windowMs, message }) => {
  const hits = new Map();
  const keyOf = (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase()}`;
  const live = (entry) => entry && Date.now() - entry.first < windowMs;

  return {
    // Middleware: blocks once `max` hits are recorded inside the window.
    check(req, res, next) {
      const entry = hits.get(keyOf(req));
      if (live(entry) && entry.count >= max) return res.status(429).json({ message });
      next();
    },
    hit(req) {
      const key = keyOf(req);
      const entry = hits.get(key);
      if (live(entry)) entry.count += 1;
      else hits.set(key, { count: 1, first: Date.now() });
    },
    clear(req) {
      hits.delete(keyOf(req));
    },
  };
};

// Login: 5 failed attempts per 15 minutes.
const login = createLimiter({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many attempts. Try again in 15 minutes.' });
export const loginLimiter = login.check;
export const recordLoginFailure = login.hit;
export const clearLoginFailures = login.clear;

// Forgot password: 3 requests per 15 minutes (counts every request).
const forgot = createLimiter({ max: 3, windowMs: 15 * 60 * 1000, message: 'Too many requests. Try again in 15 minutes.' });
export const forgotLimiter = (req, res, next) =>
  forgot.check(req, res, () => {
    forgot.hit(req);
    next();
  });
