// routes/upload.js — POST /api/upload: lưu ảnh vào public/uploads (multer), yêu cầu admin JWT
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { loadUser as loadUserFromSession, requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_ROOT);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    const base = path
      .basename(file.originalname || 'image', ext)
      .replace(/[^\w\u00C0-\u024f.-]+/gi, '_')
      .slice(0, 80);
    cb(null, `${Date.now()}-${base || 'image'}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP'));
    }
    cb(null, true);
  },
});

// POST /api/upload — field form: file
router.post(
  '/',
  loadUserFromSession,
  requireAdmin,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Ảnh tối đa 5MB'
            : err.message || 'Lỗi upload';
        return res.status(400).json({ success: false, error: msg });
      }
      next();
    });
  },
  (req, res) => {
    try {
      if (!req.file?.filename) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu file ảnh (multipart field name: file)',
        });
      }
      const url = `/uploads/${req.file.filename}`;
      // Chỉ cần { url } — frontend đọc data.url
      res.json({ url });
    } catch (e) {
      console.error('POST /api/upload error:', e);
      res.status(500).json({ success: false, error: 'Lỗi lưu file' });
    }
  }
);

export default router;
