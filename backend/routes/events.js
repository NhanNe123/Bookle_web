// routes/events.js
import express from 'express';
import Event from '../models/Event.js';
import {
  getActiveEvent,
  listEventsForAdmin,
  suggestEventDetails,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventsController.js';
import { loadUser as loadUserFromSession, requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

/** Public */
router.get('/active', getActiveEvent);

/** Admin — GET / phải đứng trước các route /:id */
router.get('/', loadUserFromSession, requireAdmin, listEventsForAdmin);

/** Admin — đặt /suggest trước /:id để không bị coi là id */
router.post('/suggest', loadUserFromSession, requireAdmin, suggestEventDetails);
router.post('/', loadUserFromSession, requireAdmin, createEvent);
router.put('/:id', loadUserFromSession, requireAdmin, updateEvent);
/** Xóa vĩnh viễn — POST tránh proxy/CDN chặn DELETE */
router.post('/:id/delete', loadUserFromSession, requireAdmin, deleteEvent);
router.delete('/:id', loadUserFromSession, requireAdmin, deleteEvent);

// PATCH /api/events/:id/deactivate — Hủy (tắt) sự kiện
router.patch('/:id/deactivate', loadUserFromSession, requireAdmin, async (req, res) => {
  try {
    const doc = await Event.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện' });
    doc.isActive = false;
    await doc.save();
    res.json({ success: true, message: 'Đã hủy sự kiện', event: doc.toObject() });
  } catch (e) {
    console.error('PATCH /api/events/:id/deactivate error:', e);
    res.status(500).json({ success: false, error: 'Lỗi hủy sự kiện' });
  }
});

export default router;
