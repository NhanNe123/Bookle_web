// routes/contact.js
import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// POST /api/contact - Gửi tin nhắn liên hệ
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email không hợp lệ'
      });
    }

    // Create contact message
    const contact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    await contact.save();

    // Log success
    console.log('✅ Contact message received from:', email);

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Gửi tin nhắn thất bại. Vui lòng thử lại sau.'
    });
  }
});

// GET /api/contact - Lấy danh sách tin nhắn (Admin)
import { loadUser, requireAdmin } from '../middleware/adminAuth.js';

router.get('/', loadUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-ipAddress -userAgent');

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách tin nhắn'
    });
  }
});

// PATCH /api/contact/:id/status — đánh dấu đã đọc / đã phản hồi
router.patch('/:id/status', loadUser, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'read', 'replied', 'archived'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
    }
    const doc = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.json({ success: true, contact: doc.toObject() });
  } catch (e) {
    console.error('PATCH /api/contact/:id/status error:', e);
    res.status(500).json({ success: false, error: 'Lỗi cập nhật' });
  }
});

// DELETE /api/contact/:id
router.delete('/:id', loadUser, requireAdmin, async (req, res) => {
  try {
    const doc = await Contact.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.json({ success: true, message: 'Đã xóa tin nhắn' });
  } catch (e) {
    console.error('DELETE /api/contact/:id error:', e);
    res.status(500).json({ success: false, error: 'Lỗi xóa' });
  }
});

export default router;

