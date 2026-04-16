// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bookle-jwt-fallback-secret';
const JWT_EXPIRES_IN = '7d';

const AVATAR_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Chỉ hỗ trợ tải lên các định dạng ảnh JPG, PNG, GIF hoặc WEBP'));
    }
    cb(null, true);
  }
});

const normalizeAvatarPath = (filepath) => {
  if (!filepath) return '';
  const normalized = filepath.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('/uploads/')) return normalized;
  if (normalized.startsWith('uploads/')) return `/${normalized}`;
  return `/uploads/avatars/${normalized.replace(/^\/+/, '')}`;
};

const removeOldAvatarFile = (avatarPath) => {
  if (!avatarPath) return;
  if (/^https?:\/\//i.test(avatarPath)) return;
  const relativePath = avatarPath.replace(/^\/+/, '');
  if (!relativePath.startsWith('uploads/avatars/')) return;

  const fullPath = path.join(process.cwd(), 'public', relativePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to remove old avatar:', err);
    }
  });
};

const router = express.Router();

// POST /api/auth/register - Đăng ký tài khoản mới
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập đầy đủ thông tin' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email đã được sử dụng' 
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isEmailVerified: false
    });

    // Generate verification token
    const verificationToken = emailService.generateVerificationToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user, verificationToken);
      console.log('✅ Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Store user in session (even if not verified yet)
    req.session.userId = user._id;
    req.session.user = user.toPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      user: user.toPublicProfile(),
      emailSent: true
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Đăng ký thất bại. Vui lòng thử lại.' 
    });
  }
});

// POST /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập đầy đủ thông tin' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        error: 'Tài khoản đã bị vô hiệu hóa' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Store user in session
    req.session.userId = user._id;
    req.session.user = user.toPublicProfile();

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Đăng nhập thất bại. Vui lòng thử lại.' 
    });
  }
});

// POST /api/auth/logout - Đăng xuất
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: 'Đăng xuất thất bại' 
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Đăng xuất thất bại' 
    });
  }
});

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng' 
      });
    }

    res.json({
      success: true,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi lấy thông tin người dùng' 
    });
  }
});

// PUT /api/auth/profile - Cập nhật thông tin cá nhân
router.put(
  '/profile',
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
      if (err) {
        console.error('Avatar upload error:', err);
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Ảnh đại diện tối đa 2MB'
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || 'Tải ảnh đại diện thất bại'
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false,
          error: 'Chưa đăng nhập' 
        });
      }

      const { name, phone } = req.body;
      let { address } = req.body;
      const user = await User.findById(req.session.userId);

      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Không tìm thấy người dùng' 
        });
      }

      let hasChanges = false;

      if (typeof name === 'string' && name.trim() && name.trim() !== user.name) {
        user.name = name.trim();
        hasChanges = true;
      }

      if (typeof phone !== 'undefined') {
        const normalizedPhone = typeof phone === 'string' ? phone.trim() : phone;
        if (normalizedPhone !== user.phone) {
          user.phone = normalizedPhone || undefined;
          hasChanges = true;
        }
      }

      if (typeof address !== 'undefined') {
        if (typeof address === 'string') {
          try {
            const parsed = JSON.parse(address);
            address = parsed;
          } catch (parseError) {
            // ignore invalid JSON, fallback to current address
            console.warn('Invalid address payload, skipping update');
            address = undefined;
          }
        }

        if (address && typeof address === 'object') {
          user.address = address;
          hasChanges = true;
        }
      }

      if (req.file) {
        const newAvatarPath = normalizeAvatarPath(`/uploads/avatars/${req.file.filename}`);
        if (user.avatar && user.avatar !== newAvatarPath) {
          removeOldAvatarFile(user.avatar);
        }
        user.avatar = newAvatarPath;
        hasChanges = true;
      }

      if (!hasChanges) {
        return res.json({
          success: true,
          message: 'Không có thay đổi nào',
          user: user.toPublicProfile()
        });
      }

      await user.save();

      // Update session
      const publicProfile = user.toPublicProfile();
      req.session.user = publicProfile;

      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        user: publicProfile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Cập nhật thông tin thất bại' 
      });
    }
  }
);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập email' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.'
      });
    }

    // Generate reset token
    const resetToken = emailService.generateVerificationToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Gửi email thất bại. Vui lòng thử lại.' 
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Thiếu thông tin' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' 
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Đặt lại mật khẩu thất bại' 
    });
  }
});

// GET /api/auth/verify-email?token=xxx - Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect('/?error=missing_token');
    }

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/?error=invalid_or_expired_token');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Redirect to homepage with success message
    res.redirect('/?verified=success');
  } catch (error) {
    console.error('Verify email error:', error);
    res.redirect('/?error=verification_failed');
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }

    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng' 
      });
    }

    if (user.isEmailVerified) {
      return res.json({ 
        success: true,
        message: 'Email đã được xác thực rồi' 
      });
    }

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user, verificationToken);

    res.json({
      success: true,
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Gửi lại email thất bại' 
    });
  }
});

// ============= Google OAuth Routes =============

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req, res, next) => {
  console.log('🔵 Google OAuth request received');
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    console.log('⚠️  Google OAuth not configured, redirecting...');
    return res.redirect('/?error=google_not_configured');
  }
  
  console.log('✅ Google OAuth configured, authenticating...');
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })(req, res, next);
});

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/?login=failed',
    session: true
  }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user._id;
    req.session.user = req.user.toPublicProfile();
    res.redirect('/?login=success');
  }
);

// ============= Facebook OAuth Routes =============

// GET /api/auth/facebook - Initiate Facebook OAuth
router.get('/facebook', (req, res, next) => {
  console.log('🔷 Facebook OAuth request received');
  
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.log('⚠️  Facebook OAuth not configured, redirecting...');
    return res.redirect('/?error=facebook_not_configured');
  }
  
  console.log('✅ Facebook OAuth configured, authenticating...');
  passport.authenticate('facebook', { 
    scope: ['email']
  })(req, res, next);
});

// GET /api/auth/facebook/callback - Facebook OAuth callback
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/?login=failed',
    session: true
  }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user._id;
    req.session.user = req.user.toPublicProfile();
    res.redirect('/?login=success');
  }
);

// ══════════════════════════════════════
// ADMIN: JWT Login + Middleware
// ══════════════════════════════════════

/** Tải user từ session cookie HOẶC JWT Bearer token */
const loadUserFromSession = async (req, _res, next) => {
  try {
    if (req.user) return next();

    // 1. JWT Bearer
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
        const u = await User.findById(decoded.id).select('-password');
        if (u) { req.user = u; return next(); }
      } catch { /* token invalid — fall through to session */ }
    }

    // 2. Session cookie
    const sid = req.session?.userId;
    if (!sid) return next();
    const u = await User.findById(sid).select('-password');
    if (u) req.user = u;
    next();
  } catch (e) { next(e); }
};

const requireAdminRole = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Cần quyền admin' });
  next();
};

// POST /api/auth/admin/login — JWT login cho trang Admin React
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Tài khoản đã bị khóa' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Tài khoản không có quyền quản trị' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (e) {
    console.error('POST /api/auth/admin/login error:', e);
    res.status(500).json({ success: false, error: 'Lỗi đăng nhập' });
  }
});

// GET /api/auth/admin/me — Xác thực token hiện tại
router.get('/admin/me', loadUserFromSession, requireAdminRole, (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar || '',
    },
  });
});

// GET /api/auth/admin/users
router.get('/admin/users', loadUserFromSession, requireAdminRole, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('GET /api/auth/admin/users error:', e);
    res.status(500).json({ success: false, error: 'Lỗi tải danh sách' });
  }
});

// PATCH /api/auth/admin/users/:id/toggle — Khóa / Mở khóa
router.patch('/admin/users/:id/toggle', loadUserFromSession, requireAdminRole, async (req, res) => {
  try {
    const doc = await User.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    if (doc._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Không thể khóa chính mình' });
    }
    doc.isActive = !doc.isActive;
    await doc.save();
    res.json({ success: true, message: doc.isActive ? 'Đã mở khóa' : 'Đã khóa', user: doc.toPublicProfile() });
  } catch (e) {
    console.error('PATCH /api/auth/admin/users/:id/toggle error:', e);
    res.status(500).json({ success: false, error: 'Lỗi cập nhật' });
  }
});

// PATCH /api/auth/admin/users/:id/role — Đổi role
router.patch('/admin/users/:id/role', loadUserFromSession, requireAdminRole, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role không hợp lệ' });
    }
    const doc = await User.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    doc.role = role;
    await doc.save();
    res.json({ success: true, message: `Đã chuyển sang ${role}`, user: doc.toPublicProfile() });
  } catch (e) {
    console.error('PATCH /api/auth/admin/users/:id/role error:', e);
    res.status(500).json({ success: false, error: 'Lỗi cập nhật' });
  }
});

export default router;

