// routes/authors.js
import express from 'express';
import Author from '../models/Author.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/authors - Lấy danh sách tác giả
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { isActive: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Get authors from Author collection
    let authors = await Author.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // If no authors in Author collection, get from Products
    if (authors.length === 0) {
      const productQuery = { isAvailable: true };
      if (search) {
        productQuery.author = { $regex: search, $options: 'i' };
      }

      const products = await Product.find(productQuery).select('author');
      const uniqueAuthors = [...new Set(products.map(p => p.author).filter(Boolean))];

      authors = uniqueAuthors.map((authorName, index) => ({
        _id: `temp-${index}`,
        name: authorName,
        slug: authorName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        bookCount: products.filter(p => p.author === authorName).length
      }));
    } else {
      // Count books for each author
      for (let author of authors) {
        const bookCount = await Product.countDocuments({ 
          author: author.name,
          isAvailable: true 
        });
        author.bookCount = bookCount;
      }
    }

    const total = search 
      ? authors.length 
      : await (Author.countDocuments(query) || Product.distinct('author', productQuery || {}).then(a => a.length));

    res.json(authors);
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách tác giả'
    });
  }
});

// GET /api/authors/:id - Lấy tác giả theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find in Author collection first
    let author = await Author.findById(id);

    // If not found, try to find by name from Products
    if (!author) {
      const products = await Product.find({ isAvailable: true }).select('author');
      const authorNames = [...new Set(products.map(p => p.author).filter(Boolean))];
      const authorName = authorNames.find(name => 
        name.toLowerCase().includes(id.toLowerCase()) || 
        id.toLowerCase().includes(name.toLowerCase())
      );

      if (authorName) {
        const bookCount = await Product.countDocuments({ 
          author: authorName,
          isAvailable: true 
        });
        const authorProducts = await Product.find({ 
          author: authorName,
          isAvailable: true 
        }).limit(10);

        author = {
          _id: id,
          name: authorName,
          slug: authorName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          bookCount,
          products: authorProducts
        };
      }
    } else {
      // Count books for author
      const bookCount = await Product.countDocuments({ 
        author: author.name,
        isAvailable: true 
      });
      author.bookCount = bookCount;
    }

    if (!author) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tác giả'
      });
    }

    res.json(author);
  } catch (error) {
    console.error('Get author error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy thông tin tác giả'
    });
  }
});

// GET /api/authors/slug/:slug - Lấy tác giả theo slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Try to find in Author collection first
    let author = await Author.findOne({ slug });

    // If not found, try to find by name from Products
    if (!author) {
      const products = await Product.find({ isAvailable: true }).select('author');
      const authorNames = [...new Set(products.map(p => p.author).filter(Boolean))];
      
      // Find author by matching slug
      const authorName = authorNames.find(name => {
        const nameSlug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        return nameSlug === slug;
      });

      if (authorName) {
        const bookCount = await Product.countDocuments({ 
          author: authorName,
          isAvailable: true 
        });

        author = {
          _id: slug,
          name: authorName,
          slug: slug,
          bookCount
        };
      }
    } else {
      // Count books for author
      const bookCount = await Product.countDocuments({ 
        author: author.name,
        isAvailable: true 
      });
      author.bookCount = bookCount;
    }

    if (!author) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tác giả'
      });
    }

    res.json(author);
  } catch (error) {
    console.error('Get author by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy thông tin tác giả'
    });
  }
});

// GET /api/authors/:id/products - Lấy sách của tác giả
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Try to find author name
    let authorName;
    const author = await Author.findById(id);
    if (author) {
      authorName = author.name;
    } else {
      // Try to find by slug or use id as name
      const products = await Product.find({ isAvailable: true }).select('author');
      const authorNames = [...new Set(products.map(p => p.author).filter(Boolean))];
      authorName = authorNames.find(name => 
        name.toLowerCase().includes(id.toLowerCase()) || 
        id.toLowerCase().includes(name.toLowerCase())
      ) || id;
    }

    // Get products by author
    const products = await Product.find({
      author: authorName,
      isAvailable: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments({
      author: authorName,
      isAvailable: true
    });

    res.json({
      items: products,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get author products error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách sách của tác giả'
    });
  }
});

export default router;

