// routes/products.js
import express from 'express';
import Product from '../models/Product.js';
import Event from '../models/Event.js';
import { CATEGORY_GROUPS, getGroupCategories } from '../config/categories.js';
import { processAIQuery } from '../services/aiService.js';
import { loadUser as loadUserFromSession, requireAdmin } from '../middleware/adminAuth.js';

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

  // Nếu đã bắt đầu bằng /uploads/, giữ nguyên
  if (/^\/uploads\//i.test(s)) {
    return s.replace(/^\/+/, '/'); // đảm bảo bắt đầu bằng 1 dấu /
  }
  
  // thêm tiền tố /uploads nếu thiếu (cho các file upload)
  if (!/^uploads\//i.test(s)) {
    s = `uploads/${s.replace(/^\/+/,'')}`;
  }
  return `/${s.replace(/^\/+/, '')}`; // đảm bảo bắt đầu bằng 1 dấu /
}

/**
 * Chuẩn hoá danh sách ảnh để frontend luôn render được:
 * - normalize từng phần tử
 * - nếu có coverImage mà chưa nằm trong images thì chèn vào đầu mảng
 */
function normalizeImagesWithCover(images, coverImage) {
  const list = (images || []).map(normalizeImageUrl).filter(Boolean);
  const cover = coverImage ? normalizeImageUrl(coverImage) : null;
  if (cover && !list.includes(cover)) {
    return [cover, ...list];
  }
  return list;
}

// 💡 map 1 product doc -> object gọn + images đã chuẩn hoá
function toListDTO(doc) {
  const o =
    doc && typeof doc.toObject === 'function'
      ? doc.toObject({ getters: false, virtuals: false })
      : doc && typeof doc === 'object'
        ? { ...doc }
        : {};
  const coverImage = o.coverImage ? normalizeImageUrl(o.coverImage) : null;
  o.images = normalizeImagesWithCover(o.images, coverImage);
  // chỉ trả những field cần cho list
  return {
    _id: o._id,
    name: o.name,
    slug: o.slug,
    sku: o.sku,
    price: o.price,
    compareAtPrice: o.compareAtPrice,
    categories: o.categories || [],
    author: o.author,
    isbn: o.isbn,
    images: o.images,
    coverImage,
    stock: o.stock || 0,
    isAvailable: o.isAvailable !== false,
    language: o.language || 'vi',
    publisher: o.publisher,
    pages: o.pages,
    shortDescription: o.shortDescription,
    description: o.description,
  };
}

function toDetailDTO(doc) {
  const o = doc.toObject({ getters: false, virtuals: false });
  if (o.coverImage) o.coverImage = normalizeImageUrl(o.coverImage);
  o.images = normalizeImagesWithCover(o.images, o.coverImage);
  return o; // chi tiết cần đủ field
}

/** Sự kiện đang diễn ra: bật + now ∈ [startDate, endDate]. */
async function findActiveEventNow() {
  const now = new Date();
  return Event.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ startDate: -1 })
    .lean();
}

function serializeActiveEvent(ev) {
  if (!ev) return null;
  return {
    _id: ev._id,
    name: ev.name,
    startDate: ev.startDate,
    endDate: ev.endDate,
    isActive: ev.isActive,
    themeConfig: ev.themeConfig || {},
    discountConfig: {
      discountPercent: ev.discountConfig?.discountPercent ?? 0,
      targetCategories: ev.discountConfig?.targetCategories || [],
    },
  };
}

function productCategoriesForPricing(item) {
  const raw = item.categories ?? item.category ?? item.categoryId;
  if (Array.isArray(raw)) return raw.map((c) => String(c));
  if (raw != null && raw !== '') return [String(raw)];
  return [];
}

function isBookEligibleForEventDiscount(item, activeEvent) {
  if (!activeEvent?.discountConfig) return false;
  const pct = Number(activeEvent.discountConfig.discountPercent);
  if (!Number.isFinite(pct) || pct <= 0) return false;
  const targets = activeEvent.discountConfig.targetCategories;
  if (!Array.isArray(targets) || targets.length === 0) return false;
  const targetSet = new Set(targets.map((t) => String(t)));
  return productCategoriesForPricing(item).some((c) => targetSet.has(c));
}

function computeSalePriceFromOriginal(originalPrice, discountPercent) {
  const base = Number(originalPrice);
  const safeBase = Number.isFinite(base) && base >= 0 ? base : 0;
  const pct = Number(discountPercent);
  const p = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  return Math.max(0, Math.round(safeBase - (safeBase * p) / 100));
}

/**
 * Gắn salePrice chỉ trên object plain (bản sao) — không save/update DB.
 * Giá gốc lấy từ `price` trong DB. salePrice = giá sau giảm hoặc bằng giá gốc khi không áp dụng.
 */
function attachSalePriceToProductLike(item, activeEvent) {
  const plain = item && typeof item === 'object' ? { ...item } : {};
  const raw = plain.price;
  const originalPrice = Number(raw);
  const hasValidPrice = Number.isFinite(originalPrice) && originalPrice >= 0;

  if (!hasValidPrice) {
    return { ...plain, salePrice: null };
  }

  if (!activeEvent || !isBookEligibleForEventDiscount(plain, activeEvent)) {
    return { ...plain, salePrice: originalPrice };
  }

  return {
    ...plain,
    salePrice: computeSalePriceFromOriginal(
      originalPrice,
      activeEvent.discountConfig.discountPercent
    ),
  };
}

function attachSalePriceToListItems(items, activeEvent) {
  if (!Array.isArray(items)) return [];
  return items.map((row) => attachSalePriceToProductLike(row, activeEvent));
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
      .select('name slug sku isbn price compareAtPrice images categories author stock isAvailable language rating ratingCount');

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

// GET /api/products/languages - Get available book languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await Product.aggregate([
      { $match: { isAvailable: true } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } }
    ]);

    // Map language codes to full names
    const languageNames = {
      'vi': { name: 'Tiếng Việt', nameEn: 'Vietnamese' },
      'en': { name: 'Tiếng Anh', nameEn: 'English' },
      'zh': { name: 'Tiếng Trung', nameEn: 'Chinese' },
      'ja': { name: 'Tiếng Nhật', nameEn: 'Japanese' },
      'ko': { name: 'Tiếng Hàn', nameEn: 'Korean' },
      'fr': { name: 'Tiếng Pháp', nameEn: 'French' },
      'de': { name: 'Tiếng Đức', nameEn: 'German' },
      'es': { name: 'Tiếng Tây Ban Nha', nameEn: 'Spanish' },
      'ru': { name: 'Tiếng Nga', nameEn: 'Russian' },
      'th': { name: 'Tiếng Thái', nameEn: 'Thai' },
      'other': { name: 'Khác', nameEn: 'Other' }
    };

    const result = languages.map(lang => ({
      code: lang._id,
      count: lang.count,
      name: languageNames[lang._id]?.name || lang._id,
      nameEn: languageNames[lang._id]?.nameEn || lang._id
    }));

    res.json({ success: true, languages: result });
  } catch (e) {
    console.error('GET /api/products/languages error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/products?page=&limit=&q=&category=&categoryGroup=&minPrice=&maxPrice=&available=&language=
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip  = (page - 1) * limit;

    const filter = {};
    
    // Search (ưu tiên tìm theo mã/ISBN nếu người dùng nhập đúng)
    if (req.query.q) {
      const q = String(req.query.q).trim();
      const qNoSpaces = q.replace(/\s+/g, '');

      // If it looks like a SKU (BKYYMM-xxxxx) or ISBN, try exact first
      if (/^BK\d{4}-\d{5}$/i.test(q)) {
        filter.sku = q.toUpperCase();
      } else if (/^\d{10}(\d{3})?$/.test(qNoSpaces)) {
        filter.isbn = qNoSpaces;
      } else {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { sku: { $regex: q, $options: 'i' } },
          { isbn: { $regex: qNoSpaces, $options: 'i' } },
          { author: { $regex: q, $options: 'i' } },
        ];
      }
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
    
    // Language filter (book language: vi, en, zh, ja, ko, etc.)
    if (req.query.language) {
      filter.language = req.query.language;
    }

    // Sorting options
    let sortOption = { createdAt: -1 }; // Default: newest first
    const sortBy = req.query.sortBy;
    
    switch (sortBy) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'name-asc':
        // For Vietnamese sorting, we use collation
        sortOption = { name: 1 };
        break;
      case 'name-desc':
        sortOption = { name: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1, ratingCount: -1 };
        break;
      case 'popularity':
        sortOption = { ratingCount: -1, rating: -1 };
        break;
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const collationOptions = { locale: 'vi', strength: 1 };

    if (sortBy === 'random') {
      const pipeline = [
        { $match: filter },
        { $addFields: { _sortRand: { $rand: {} } } },
        { $sort: { _sortRand: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { _sortRand: 0 } },
      ];
      const [activeEvent, docs, total] = await Promise.all([
        findActiveEventNow(),
        Product.aggregate(pipeline),
        Product.countDocuments(filter),
      ]);
      const items = attachSalePriceToListItems(docs.map(toListDTO), activeEvent);
      res.json({
        items,
        total,
        page,
        pages: Math.ceil(total / limit),
        activeEvent: serializeActiveEvent(activeEvent),
      });
      return;
    }

    const [activeEvent, docs, total] = await Promise.all([
      findActiveEventNow(),
      Product.find(filter)
        .collation(collationOptions)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('name slug sku isbn price compareAtPrice images coverImage categories author stock isAvailable language rating ratingCount publisher pages shortDescription description')
        .lean(),
      Product.countDocuments(filter),
    ]);

    const items = attachSalePriceToListItems(docs.map(toListDTO), activeEvent);
    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      activeEvent: serializeActiveEvent(activeEvent),
    });
  } catch (e) {
    console.error('GET /api/products error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/products/ai-search — Chat tư vấn: RAG (MongoDB) + Ollama cục bộ
router.post('/ai-search', async (req, res) => {
  try {
    const { query, conversationHistory = [], contextProductId } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required' 
      });
    }

    // Ollama + RAG trong aiService; lỗi toàn cục → fallback tìm sách
    let result;
    try {
      result = await processAIQuery(query.trim(), conversationHistory, {
        contextProductId: contextProductId || undefined,
      });
    } catch (error) {
      // If any error, use fallback search
      console.warn('⚠️  AI service error. Using fallback search:', error.message);
      return await handleFallbackSearch(query.trim(), res);
    }

    // Format books for response - books from AI service are already plain objects
    const books = result.books.map(book => {
      // Normalize images
      const normalizedCover = book.coverImage ? normalizeImageUrl(book.coverImage) : null;
      const normalizedImages = normalizeImagesWithCover(book.images, normalizedCover);
      return {
        _id: book._id,
          name: book.name,
        slug: book.slug,
          sku: book.sku,
          isbn: book.isbn,
        price: book.price,
        compareAtPrice: book.compareAtPrice,
        categories: book.categories || [],
        author: book.author,
        images: normalizedImages,
        coverImage: normalizedCover,
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

// GET /api/products/:id/related - Get related products
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    
    // Find the current product
    let currentProduct = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      currentProduct = await Product.findById(id);
    }
    if (!currentProduct) {
      currentProduct = await Product.findOne({ slug: id });
    }
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Build smart matching query
    const matchConditions = [];
    
    // 1. Match by categories (highest priority)
    if (currentProduct.categories && currentProduct.categories.length > 0) {
      matchConditions.push({ categories: { $in: currentProduct.categories } });
    }
    
    // 2. Match by author
    if (currentProduct.author) {
      matchConditions.push({ author: currentProduct.author });
    }
    
    // 3. Match by genres
    if (currentProduct.genres && currentProduct.genres.length > 0) {
      matchConditions.push({ genres: { $in: currentProduct.genres } });
    }
    
    // 4. Match by language (book language)
    if (currentProduct.language) {
      matchConditions.push({ language: currentProduct.language });
    }
    
    // 5. Match by similar price range (±30%)
    if (currentProduct.price) {
      const minPrice = currentProduct.price * 0.7;
      const maxPrice = currentProduct.price * 1.3;
      matchConditions.push({ price: { $gte: minPrice, $lte: maxPrice } });
    }

    // Find related products excluding current product
    const [activeEvent, relatedProducts] = await Promise.all([
      findActiveEventNow(),
      Product.aggregate([
      {
        $match: {
          _id: { $ne: currentProduct._id },
          isAvailable: true,
          $or: matchConditions.length > 0 ? matchConditions : [{ isAvailable: true }]
        }
      },
      {
        // Add a score based on how many conditions match
        $addFields: {
          relevanceScore: {
            $add: [
              // Category match (weight: 5)
              {
                $cond: [
                  { $gt: [{ $size: { $ifNull: [{ $setIntersection: ['$categories', currentProduct.categories || []] }, []] } }, 0] },
                  5,
                  0
                ]
              },
              // Same author (weight: 4)
              {
                $cond: [
                  { $eq: ['$author', currentProduct.author || ''] },
                  4,
                  0
                ]
              },
              // Genre match (weight: 3)
              {
                $cond: [
                  { $gt: [{ $size: { $ifNull: [{ $setIntersection: ['$genres', currentProduct.genres || []] }, []] } }, 0] },
                  3,
                  0
                ]
              },
              // Same language (weight: 2)
              {
                $cond: [
                  { $eq: ['$language', currentProduct.language || 'vi'] },
                  2,
                  0
                ]
              },
              // Rating bonus (weight: 1 per rating point)
              { $ifNull: ['$rating', 0] }
            ]
          }
        }
      },
      { $sort: { relevanceScore: -1, rating: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          sku: 1,
          isbn: 1,
          price: 1,
          compareAtPrice: 1,
          coverImage: 1,
          images: 1,
          categories: 1,
          author: 1,
          stock: 1,
          isAvailable: 1,
          rating: 1,
          ratingCount: 1,
          language: 1
        }
      }
    ]),
    ]);

    // Normalize images for response (plain objects — không mutate document DB)
    const items = attachSalePriceToListItems(
      relatedProducts.map((doc) => ({
        ...doc,
        images: normalizeImagesWithCover(doc.images, doc.coverImage),
      })),
      activeEvent
    );

    res.json({
      success: true,
      items,
      activeEvent: serializeActiveEvent(activeEvent),
      currentProduct: {
        _id: currentProduct._id,
        name: currentProduct.name,
        categories: currentProduct.categories,
        author: currentProduct.author,
        language: currentProduct.language
      }
    });
  } catch (e) {
    console.error('GET /api/products/:id/related error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
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
      const activeEvent = await findActiveEventNow();

      // Fetch products for each category group
      for (const [groupKey, group] of Object.entries(CATEGORY_GROUPS)) {
        const groupFilter = { 
          ...filter,
          categories: { $in: group.dbCategories }
        };
        
        const products = await Product.find(groupFilter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('name slug sku isbn price compareAtPrice images categories author stock isAvailable')
          .lean();
        
        result[groupKey] = {
          ...group,
          products: attachSalePriceToListItems(products.map(toListDTO), activeEvent),
        };
      }
      
      // Chỉ trả về map nhóm (shop.js dùng Object.entries — không gắn activeEvent cùng cấp)
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

    const activeEvent = await findActiveEventNow();
    const priced = attachSalePriceToProductLike(toDetailDTO(product), activeEvent);
    res.json({ ...priced, activeEvent: serializeActiveEvent(activeEvent) });
  } catch (e) {
    console.error('GET /api/products/:idOrSlug error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CRUD (POST / PUT / DELETE) — yêu cầu admin session
// ═══════════════════════════════════════════════════════════

function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST /api/products — Tạo sách mới
router.post('/', loadUserFromSession, requireAdmin, async (req, res) => {
  try {
    const {
      name, author, price, compareAtPrice, categories, isbn,
      stock, isAvailable, language, publisher, pages,
      shortDescription, description, coverImage, images,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Tên sách là bắt buộc' });
    }
    if (price == null || Number(price) < 0) {
      return res.status(400).json({ success: false, error: 'Giá không hợp lệ' });
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);
    const product = await Product.create({
      name: String(name).trim(),
      slug,
      author: author || '',
      price: Number(price),
      compareAtPrice: compareAtPrice != null ? Number(compareAtPrice) : undefined,
      categories: Array.isArray(categories) ? categories : [],
      isbn: isbn || '',
      stock: Number(stock) || 0,
      isAvailable: isAvailable !== false,
      language: language || 'vi',
      publisher: publisher || '',
      pages: pages ? Number(pages) : undefined,
      shortDescription: shortDescription || '',
      description: description || '',
      coverImage: coverImage || '',
      images: Array.isArray(images) ? images : [],
    });

    res.status(201).json({ success: true, product: product.toObject() });
  } catch (e) {
    console.error('POST /api/products error:', e);
    if (e.name === 'ValidationError') {
      const msgs = Object.values(e.errors || {}).map((x) => x.message);
      return res.status(400).json({ success: false, error: msgs.join('; ') });
    }
    res.status(500).json({ success: false, error: 'Lỗi tạo sách' });
  }
});

// PUT /api/products/:id — Cập nhật sách
router.put('/:id', loadUserFromSession, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const doc = await Product.findById(id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy sách' });

    const allowed = [
      'name', 'author', 'price', 'compareAtPrice', 'categories', 'isbn',
      'stock', 'isAvailable', 'language', 'publisher', 'pages',
      'shortDescription', 'description', 'coverImage', 'images',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'price' || key === 'compareAtPrice' || key === 'stock' || key === 'pages') {
          doc[key] = Number(req.body[key]);
        } else {
          doc[key] = req.body[key];
        }
      }
    }

    await doc.save();
    res.json({ success: true, product: doc.toObject() });
  } catch (e) {
    console.error('PUT /api/products/:id error:', e);
    if (e.name === 'ValidationError') {
      const msgs = Object.values(e.errors || {}).map((x) => x.message);
      return res.status(400).json({ success: false, error: msgs.join('; ') });
    }
    res.status(500).json({ success: false, error: 'Lỗi cập nhật sách' });
  }
});

// DELETE /api/products/:id — Xóa sách
router.delete('/:id', loadUserFromSession, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const doc = await Product.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy sách' });

    res.json({ success: true, message: 'Đã xóa sách' });
  } catch (e) {
    console.error('DELETE /api/products/:id error:', e);
    res.status(500).json({ success: false, error: 'Lỗi xóa sách' });
  }
});

export default router;
