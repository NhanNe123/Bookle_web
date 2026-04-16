import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bookle-jwt-fallback-secret';

/** Tải user từ JWT Bearer HOẶC session cookie */
export const loadUser = async (req, _res, next) => {
  try {
    if (req.user) return next();

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
        const u = await User.findById(decoded.id).select('-password');
        if (u) { req.user = u; return next(); }
      } catch { /* invalid token — fall through */ }
    }

    const sid = req.session?.userId;
    if (sid) {
      const u = await User.findById(sid).select('-password');
      if (u) req.user = u;
    }
    next();
  } catch (e) { next(e); }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Cần quyền admin' });
  next();
};
