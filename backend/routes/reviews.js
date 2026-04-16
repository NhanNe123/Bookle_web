// routes/reviews.js
import express from 'express';
import mongoose from 'mongoose'; // ✅ THÊM DÒNG NÀY
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// Helper: tìm product theo id hoặc slug
async function findProductByParam(productIdOrSlug) {
  if (mongoose.Types.ObjectId.isValid(productIdOrSlug)) {
    // Nếu là ObjectId hợp lệ → tìm theo _id
    return Product.findById(productIdOrSlug);
  }
  // Ngược lại → coi như slug
  return Product.findOne({ slug: productIdOrSlug });
}

// GET /api/products/:productId/reviews - Lấy danh sách reviews của sản phẩm
router.get('/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // 🔍 Tìm sản phẩm theo id hoặc slug
    const product = await findProductByParam(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sản phẩm'
      });
    }

    const realProductId = product._id;

    // Lấy reviews đã được approve
    const [reviews, total] = await Promise.all([
      Review.find({ 
        product: realProductId,
        isApproved: true 
      })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ 
        product: realProductId,
        isApproved: true 
      })
    ]);

    const formattedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      return {
        _id: reviewObj._id,
        rating: reviewObj.rating,
        comment: reviewObj.comment,
        name: reviewObj.user?.name || reviewObj.name,
        email: reviewObj.user?.email || reviewObj.email,
        avatar: reviewObj.user?.avatar || '',
        isEdited: reviewObj.isEdited,
        createdAt: reviewObj.createdAt,
        updatedAt: reviewObj.updatedAt,
        userId: reviewObj.user?._id || null
      };
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: total
    });
  } catch (error) {
    console.error('GET /api/products/:productId/reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách đánh giá'
    });
  }
});

// POST /api/products/:productId/reviews - Tạo review mới (yêu cầu đăng nhập)
router.post('/products/:productId/reviews', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Vui lòng đăng nhập để bình luận'
      });
    }

    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ đánh giá và bình luận'
      });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Bình luận phải có ít nhất 10 ký tự'
      });
    }

    if (comment.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Bình luận không được vượt quá 2000 ký tự'
      });
    }

    // 🔍 Tìm sản phẩm theo id hoặc slug
    const product = await findProductByParam(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sản phẩm'
      });
    }
    const realProductId = product._id;

    // Lấy thông tin user
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra xem user đã review sản phẩm này chưa
    const existingReview = await Review.findOne({
      product: realProductId,
      user: req.session.userId
    });

    if (existingReview) {
      existingReview.rating = ratingNum;
      existingReview.comment = comment.trim();
      existingReview.isEdited = true;
      await existingReview.save();

      // ✅ Cập nhật rating dùng _id thật
      await updateProductRating(realProductId);

      const reviewObj = existingReview.toObject();
      return res.json({
        success: true,
        message: 'Cập nhật đánh giá thành công',
        review: {
          _id: reviewObj._id,
          rating: reviewObj.rating,
          comment: reviewObj.comment,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          isEdited: reviewObj.isEdited,
          createdAt: reviewObj.createdAt,
          updatedAt: reviewObj.updatedAt,
          userId: user._id
        }
      });
    }

    // Tạo review mới
    const review = new Review({
      product: realProductId, // ✅ DÙNG _id, KHÔNG DÙNG slug
      user: req.session.userId,
      rating: ratingNum,
      comment: comment.trim(),
      name: user.name,
      email: user.email,
      isApproved: true
    });

    await review.save();

    // ✅ Cập nhật rating trung bình của sản phẩm
    await updateProductRating(realProductId);

    const reviewObj = review.toObject();
    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      review: {
        _id: reviewObj._id,
        rating: reviewObj.rating,
        comment: reviewObj.comment,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isEdited: false,
        createdAt: reviewObj.createdAt,
        updatedAt: reviewObj.updatedAt,
        userId: user._id
      }
    });
  } catch (error) {
    console.error('POST /api/products/:productId/reviews error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã đánh giá sản phẩm này rồi'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Lỗi tạo đánh giá'
    });
  }
});

// Helper function để cập nhật rating trung bình của sản phẩm
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ 
      product: productId,
      isApproved: true 
    });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        ratingCount: 0
      });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      ratingCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

// ══════════════════════════════════════
// ADMIN endpoints
// ══════════════════════════════════════
import { loadUser, requireAdmin } from '../middleware/adminAuth.js';

// GET /api/reviews/admin/list
router.get('/reviews/admin/list', loadUser, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.approved === 'true') filter.isApproved = true;
    if (req.query.approved === 'false') filter.isApproved = false;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product', 'name slug')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('GET /api/reviews/admin/list error:', e);
    res.status(500).json({ success: false, error: 'Lỗi tải đánh giá' });
  }
});

// PATCH /api/reviews/:id/approve — Ẩn/Hiện review
router.patch('/reviews/:id/approve', loadUser, requireAdmin, async (req, res) => {
  try {
    const doc = await Review.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy đánh giá' });

    doc.isApproved = req.body.isApproved !== undefined ? Boolean(req.body.isApproved) : !doc.isApproved;
    await doc.save();
    await updateProductRating(doc.product);

    res.json({ success: true, message: doc.isApproved ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá', review: doc.toObject() });
  } catch (e) {
    console.error('PATCH /api/reviews/:id/approve error:', e);
    res.status(500).json({ success: false, error: 'Lỗi cập nhật' });
  }
});

// DELETE /api/reviews/:id
router.delete('/reviews/:id', loadUser, requireAdmin, async (req, res) => {
  try {
    const doc = await Review.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy đánh giá' });
    await updateProductRating(doc.product);
    res.json({ success: true, message: 'Đã xóa đánh giá' });
  } catch (e) {
    console.error('DELETE /api/reviews/:id error:', e);
    res.status(500).json({ success: false, error: 'Lỗi xóa đánh giá' });
  }
});

export default router;