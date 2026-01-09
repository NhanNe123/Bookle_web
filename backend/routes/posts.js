// routes/posts.js
import express from 'express';
import Post from '../models/Post.js';

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

export default router;

