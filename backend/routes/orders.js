// routes/orders.js
import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { loadUser } from '../middleware/adminAuth.js';

const router = express.Router();

router.use(loadUser);

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập' });
  }
  next();
};

const isValidEmail = (e) =>
  typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Calculate shipping fee based on city
const calculateShippingFee = (city, subtotal) => {
  // Free shipping for orders over 200,000 VND
  if (subtotal >= 200000) return 0;
  
  const majorCities = ['Hà Nội', 'TP.HCM', 'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Đà Nẵng'];
  const cityLower = city?.toLowerCase() || '';
  
  if (majorCities.some(c => cityLower.includes(c.toLowerCase()))) {
    return 20000; // 20k for major cities
  }
  return 35000; // 35k for other provinces
};

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { 
      items, 
      shippingAddress, 
      shippingMethod = 'standard',
      paymentMethod = 'cod',
      customerNotes,
      discountCode
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Giỏ hàng trống' 
      });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
        !shippingAddress.address || !shippingAddress.district || !shippingAddress.city) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vui lòng điền đầy đủ thông tin giao hàng' 
      });
    }

    if (!req.user && !isValidEmail(shippingAddress.email)) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập email liên hệ hợp lệ để xác nhận đơn (khách không đăng nhập)',
      });
    }

    // Verify products and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId || item._id);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          error: `Sản phẩm không tồn tại: ${item.name || item.productId}` 
        });
      }

      if (!product.isAvailable || product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Sản phẩm "${product.name}" không đủ số lượng trong kho` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || ''
      });
    }

    // Calculate shipping and discount
    const shippingFee = calculateShippingFee(shippingAddress.city, subtotal);
    let discount = 0;

    // TODO: Implement discount code validation
    if (discountCode) {
      // Placeholder for discount logic
    }

    const total = subtotal + shippingFee - discount;

    // Create order
    const order = new Order({
      user: req.user?._id || null,
      guestEmail: req.user ? null : String(shippingAddress.email).trim().toLowerCase(),
      items: orderItems,
      subtotal,
      shippingFee,
      discount,
      discountCode: discountCode || null,
      total,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      customerNotes,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Đơn hàng được tạo',
        updatedAt: new Date()
      }]
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi tạo đơn hàng. Vui lòng thử lại.' 
    });
  }
});

// GET /api/orders - Get user's orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { user: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('orderNumber items subtotal shippingFee discount total status paymentStatus paymentMethod createdAt'),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    res.status(500).json({ success: false, error: 'Lỗi tải danh sách đơn hàng' });
  }
});

// ══ ADMIN: Danh sách tất cả đơn hàng ══
import { requireAdmin } from '../middleware/adminAuth.js';

router.get('/admin/list', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { status, q } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [
        { orderNumber: re },
        { 'shippingAddress.fullName': re },
        { 'shippingAddress.phone': re },
        { guestEmail: re },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('GET /api/orders/admin/list error:', e);
    res.status(500).json({ success: false, error: 'Lỗi tải danh sách đơn hàng' });
  }
});

// ══ ADMIN: Cập nhật trạng thái đơn hàng ══
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowed = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Trạng thái không hợp lệ. Cho phép: ${allowed.join(', ')}` });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });

    const prev = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Admin chuyển ${prev} → ${status}`,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    if (status === 'confirmed' && !order.confirmedAt) order.confirmedAt = new Date();
    if (status === 'shipping' && !order.shippedAt) order.shippedAt = new Date();
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    }
    if (status === 'cancelled' && !order.cancelledAt) {
      order.cancelledAt = new Date();
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    await order.save();
    res.json({ success: true, message: `Đã chuyển sang ${status}`, order: order.toObject() });
  } catch (e) {
    console.error('PATCH /api/orders/:id/status error:', e);
    res.status(500).json({ success: false, error: 'Lỗi cập nhật trạng thái' });
  }
});

// GET /api/orders/track/:orderNumber — đặt trước /:id để không bị coi id = "track"
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { email } = req.query;

    const order = await Order.findOne({ orderNumber })
      .select('orderNumber status statusHistory shippingAddress.city paymentStatus paymentMethod total createdAt shippedAt deliveredAt guestEmail');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
    }

    if (order.guestEmail && String(email || '').trim().toLowerCase() !== order.guestEmail) {
      return res.status(403).json({ success: false, error: 'Email không khớp' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('GET /api/orders/track/:orderNumber error:', error);
    res.status(500).json({ success: false, error: 'Lỗi tra cứu đơn hàng' });
  }
});

// GET /api/orders/:id - Get order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    // Try to find by orderNumber first
    order = await Order.findOne({ orderNumber: id })
      .populate('items.product', 'name slug images');

    // If not found, try by _id
    if (!order && /^[0-9a-fA-F]{24}$/.test(id)) {
      order = await Order.findById(id)
        .populate('items.product', 'name slug images');
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
    }

    const isOwner = req.user && order.user?.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('GET /api/orders/:id error:', error);
    res.status(500).json({ success: false, error: 'Lỗi tải chi tiết đơn hàng' });
  }
});

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      $or: [
        { _id: id },
        { orderNumber: id }
      ],
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Không thể hủy đơn hàng ở trạng thái này' 
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'Khách hàng yêu cầu hủy';
    order.statusHistory.push({
      status: 'cancelled',
      note: reason || 'Khách hàng yêu cầu hủy',
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('PUT /api/orders/:id/cancel error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hủy đơn hàng' });
  }
});

export default router;
