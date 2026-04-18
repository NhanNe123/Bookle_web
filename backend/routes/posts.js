// routes/posts.js
import express from 'express';
import Post from '../models/Post.js';
import { loadUser, requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/posts - Get all posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, isPublished } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    } else {
      // Default: only published posts for public API
      query.isPublished = true;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Get posts
    const posts = await Post.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Don't send full content in list

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      items: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách bài viết'
    });
  }
});

// GET /api/posts/:id - Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID or slug
    let post = await Post.findById(id);
    
    if (!post) {
      post = await Post.findOne({ slug: id });
    }
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết'
      });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json({
      success: true,
      item: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy thông tin bài viết'
    });
  }
});

// GET /api/posts/slug/:slug - Get post by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const post = await Post.findOne({ slug, isPublished: true });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết'
      });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json({
      success: true,
      item: post
    });
  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy thông tin bài viết'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CRUD (yêu cầu admin)
// ═══════════════════════════════════════════════════════════
router.use(loadUser);

// GET /api/posts/admin/list
router.get('/admin/list', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { q, category, isPublished } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isPublished !== undefined && isPublished !== '') {
      filter.isPublished = String(isPublished) === 'true';
    }
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ title: re }, { excerpt: re }, { author: re }, { slug: re }];
    }

    const [items, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('GET /api/posts/admin/list error:', e);
    res.status(500).json({ success: false, error: 'Lỗi tải danh sách bài viết' });
  }
});

// POST /api/posts
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      images,
      category,
      author,
      tags,
      isPublished,
      meta,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'Tiêu đề là bắt buộc' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung là bắt buộc' });
    }

    const doc = await Post.create({
      title: String(title).trim(),
      slug: slug ? String(slug).trim().toLowerCase() : undefined,
      excerpt: excerpt || '',
      content: String(content),
      featuredImage: featuredImage || '',
      images: Array.isArray(images) ? images : [],
      category: category || undefined,
      author: author || req.user?.name || 'Admin',
      tags: Array.isArray(tags) ? tags : [],
      isPublished: isPublished === true,
      meta: meta && typeof meta === 'object' ? meta : undefined,
    });

    res.status(201).json({ success: true, item: doc.toObject() });
  } catch (e) {
    console.error('POST /api/posts error:', e);
    if (e.name === 'ValidationError') {
      const msgs = Object.values(e.errors || {}).map((x) => x.message);
      return res.status(400).json({ success: false, error: msgs.join('; ') });
    }
    if (e.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug đã tồn tại' });
    }
    res.status(500).json({ success: false, error: 'Lỗi tạo bài viết' });
  }
});

// PUT /api/posts/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const doc = await Post.findById(id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết' });

    const allowed = [
      'title', 'slug', 'excerpt', 'content',
      'featuredImage', 'images', 'category', 'author',
      'tags', 'isPublished', 'meta',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        doc[key] = req.body[key];
      }
    }
    if (typeof doc.slug === 'string') {
      doc.slug = doc.slug.trim().toLowerCase();
    }

    await doc.save();
    res.json({ success: true, item: doc.toObject() });
  } catch (e) {
    console.error('PUT /api/posts/:id error:', e);
    if (e.name === 'ValidationError') {
      const msgs = Object.values(e.errors || {}).map((x) => x.message);
      return res.status(400).json({ success: false, error: msgs.join('; ') });
    }
    if (e.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug đã tồn tại' });
    }
    res.status(500).json({ success: false, error: 'Lỗi cập nhật bài viết' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const doc = await Post.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy bài viết' });
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (e) {
    console.error('DELETE /api/posts/:id error:', e);
    res.status(500).json({ success: false, error: 'Lỗi xóa bài viết' });
  }
});

export default router;

