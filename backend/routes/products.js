// routes/products.js
import express from 'express';
import Product from '../models/Product.js';
import { CATEGORY_GROUPS, getGroupCategories } from '../config/categories.js';
import { processAIQuery } from '../services/aiService.js';

const router = express.Router();

// 💡 chuẩn hoá 1 url ảnh -> luôn trả về /uploads/... (trừ /assets/)
function normalizeImageUrl(img) {
  if (!img) return null;
  let s = String(img).trim().replace(/\\/g, '/'); // fix backslash Windows

  // nếu đã là URL tuyệt đối thì giữ nguyên
  if (/^https?:\/\//i.test(s)) return s;

  // bỏ tiền tố public/ nếu có
  s = s.replace(/^public\//i, '');

  // Nếu đã bắt đầu bằng /assets/, giữ nguyên (đã được serve bởi express.static)
  if (/^\/assets\//i.test(s)) {
    return s.replace(/^\/+/, '/'); // đảm bảo bắt đầu bằng 1 dấu /
  }

  // thêm tiền tố /uploads nếu thiếu (cho các file upload)
  if (!/^uploads\//i.test(s)) {
    s = `uploads/${s.replace(/^\/+/,'')}`;
  }
  return `/${s.replace(/^\/+/, '')}`; // đảm bảo bắt đầu bằng 1 dấu /
}

// 💡 map 1 product doc -> object gọn + images đã chuẩn hoá
function toListDTO(doc) {
  const o = doc.toObject({ getters: false, virtuals: false });
  o.images = (o.images || []).map(normalizeImageUrl).filter(Boolean);
  // chỉ trả những field cần cho list
  return {
    _id: o._id,
    name: o.name,
    slug: o.slug,
    price: o.price,
    compareAtPrice: o.compareAtPrice,
    categories: o.categories || [],
    author: o.author,
    images: o.images,
    stock: o.stock || 0,
    isAvailable: o.isAvailable !== false
  };
}

function toDetailDTO(doc) {
  const o = doc.toObject({ getters: false, virtuals: false });
  o.images = (o.images || []).map(normalizeImageUrl).filter(Boolean);
  return o; // chi tiết cần đủ field
}

// Fallback search when AI is not available
async function handleFallbackSearch(query, res) {
  try {
    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(/\s+/).filter(k => k.length > 1);
    
    // Parse special queries
    let filter = { isAvailable: true };
    let sortOption = { rating: -1, createdAt: -1 };
    
    // Handle price-based queries
    if (lowerQuery.includes('dưới') || lowerQuery.includes('duoi')) {
      const priceMatch = lowerQuery.match(/(\d+)/);
      if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1]) * 1000; // Convert to VND (e.g., 100 -> 100000)
        filter.price = { $lte: maxPrice };
      }
    }
    
    // Handle rating-based queries
    if (lowerQuery.includes('sao') || lowerQuery.includes('rating') || lowerQuery.includes('đánh giá')) {
      const ratingMatch = lowerQuery.match(/(\d+)/);
      if (ratingMatch) {
        filter.rating = { $gte: parseFloat(ratingMatch[1]) };
      }
    }
    
    // Handle "hot" or "mới" queries
    if (lowerQuery.includes('hot') || lowerQuery.includes('bán chạy')) {
      sortOption = { ratingCount: -1, rating: -1 };
    } else if (lowerQuery.includes('mới')) {
      sortOption = { createdAt: -1 };
    }
    
    // Handle category-based queries
    const categoryKeywords = {
      'tiểu thuyết': ['Tiểu thuyết', 'Văn học Việt Nam', 'Văn học nước ngoài'],
      'kinh doanh': ['Kinh doanh', 'Marketing - Bán hàng', 'Quản trị - Lãnh đạo'],
      'khoa học': ['Khoa học', 'Công nghệ thông tin', 'Khoa học - Kỹ thuật'],
      'thiếu nhi': ['Thiếu nhi', 'Truyện tranh'],
      'tâm lý': ['Tâm lý - Kỹ năng sống', 'Tâm lý học'],
      'lịch sử': ['Lịch sử', 'Văn hóa - Xã hội'],
      'truyện tranh': ['Truyện tranh', 'Manga - Comic'],
    };
    
    for (const [key, categories] of Object.entries(categoryKeywords)) {
      if (lowerQuery.includes(key)) {
        filter.categories = { $in: categories };
        break;
      }
    }
    
    // Add keyword search if no special filter applied
    if (keywords.length > 0 && !filter.categories && !filter.price && !filter.rating) {
      filter.$or = [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { author: { $regex: keywords.join('|'), $options: 'i' } },
        { shortDescription: { $regex: keywords.join('|'), $options: 'i' } },
        { categories: { $regex: keywords.join('|'), $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(6)
      .select('name slug price compareAtPrice images categories author stock isAvailable rating ratingCount');

    const books = products.map(toListDTO).map(p => ({
      ...p,
      rating: p.rating || 0,
      ratingCount: p.ratingCount || 0
    }));

    const response = books.length > 0
      ? `Tôi tìm thấy ${books.length} cuốn sách phù hợp với "${query}":`
      : `Không tìm thấy sách nào phù hợp với "${query}". Bạn có thể thử tìm với từ khóa khác.`;

    return res.json({
      success: true,
      response,
      books
    });
  } catch (error) {
    console.error('Fallback search error:', error);
    return res.json({
      success: true,
      response: `Xin lỗi, đã có lỗi xảy ra khi tìm kiếm "${query}". Vui lòng thử lại sau.`,
      books: []
    });
  }
}

// GET /api/products?page=&limit=&q=&category=&categoryGroup=&minPrice=&maxPrice=&available=
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    
    // Search by name
    if (req.query.q) {
      filter.name = { $regex: req.query.q, $options: 'i' };
    }
    
    // Filter by specific category
    if (req.query.category) {
      filter.categories = req.query.category;
    }
    
    // Filter by category group (e.g., 'van-hoc-nghe-thuat')
    if (req.query.categoryGroup) {
      const groupCategories = getGroupCategories(req.query.categoryGroup);
      if (groupCategories.length > 0) {
        filter.categories = { $in: groupCategories };
      }
    }
    
  // Price range filter
  if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
    const parseCurrency = (value) => {
      if (value === undefined) return undefined;
      const sanitized = String(value)
        .replace(/[^0-9.,-]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(/,/g, '.');

      const number = Number(sanitized);
      return Number.isFinite(number) ? number : undefined;
    };

    const minPrice = parseCurrency(req.query.minPrice);
    const maxPrice = parseCurrency(req.query.maxPrice);

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = maxPrice;
      }
    }
  }
    
    // Availability filter
    if (req.query.available !== undefined) {
      filter.isAvailable = String(req.query.available).toLowerCase() === 'true';
    }

    const [docs, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name slug price compareAtPrice images categories author stock isAvailable'),
      Product.countDocuments(filter),
    ]);

    const items = docs.map(toListDTO);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('GET /api/products error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/products/ai-search - AI Chat search endpoint using Google Gemini (FREE)
router.post('/ai-search', async (req, res) => {
  try {
    const { query, conversationHistory = [] } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required' 
      });
    }

    // Use AI service (Gemini) - handles errors internally with fallback
    let result;
    try {
      result = await processAIQuery(query.trim(), conversationHistory);
    } catch (error) {
      // If any error, use fallback search
      console.warn('⚠️  AI service error. Using fallback search:', error.message);
      return await handleFallbackSearch(query.trim(), res);
    }

    // Format books for response - books from AI service are already plain objects
    const books = result.books.map(book => {
      // Normalize images
      const normalizedImages = (book.images || []).map(normalizeImageUrl).filter(Boolean);
      return {
        _id: book._id,
        name: book.name,
        slug: book.slug,
        price: book.price,
        compareAtPrice: book.compareAtPrice,
        categories: book.categories || [],
        author: book.author,
        images: normalizedImages,
        stock: book.stock || 0,
        isAvailable: book.isAvailable !== false,
        rating: book.rating || 0,
        ratingCount: book.ratingCount || 0
      };
    });

    res.json({
      success: true,
      response: result.response,
      books
    });
  } catch (error) {
    console.error('POST /api/products/ai-search error:', error);
    
    // Always try fallback search for any errors
    try {
      return await handleFallbackSearch(req.body.query?.trim() || '', res);
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      res.status(500).json({
        success: false,
        error: 'Lỗi tìm kiếm sách. Vui lòng thử lại sau.'
      });
    }
  }
});

// GET /api/products/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  // Special handling for by-groups endpoint
  if (req.params.idOrSlug === 'by-groups') {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 8, 50);
      const filter = { isAvailable: true };
      
      // Optional search query
      if (req.query.q) {
        filter.name = { $regex: req.query.q, $options: 'i' };
      }
      
      // Price range filter
      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) {
          filter.price.$gte = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
          filter.price.$lte = parseFloat(req.query.maxPrice);
        }
      }
      
      const result = {};
      
      // Fetch products for each category group
      for (const [groupKey, group] of Object.entries(CATEGORY_GROUPS)) {
        const groupFilter = { 
          ...filter,
          categories: { $in: group.dbCategories }
        };
        
        const products = await Product.find(groupFilter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('name slug price compareAtPrice images categories author stock isAvailable');
        
        result[groupKey] = {
          ...group,
          products: products.map(toListDTO)
        };
      }
      
      res.json(result);
    } catch (e) {
      console.error('GET /api/products/by-groups error:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
    return;
  }
  
  try {
    const { idOrSlug } = req.params;
    let product = null;

    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug });
    }
    if (!product) return res.status(404).json({ error: 'Not found' });

    res.json(toDetailDTO(product));
  } catch (e) {
    console.error('GET /api/products/:idOrSlug error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
