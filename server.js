// server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cors from 'cors';
import fs from 'fs';
import { connectDB } from './backend/db/index.js';
import productsRouter from './backend/routes/products.js';
import authRouter from './backend/routes/auth.js';
import contactRouter from './backend/routes/contact.js';
import authorsRouter from './backend/routes/authors.js';
import postsRouter from './backend/routes/posts.js';
import reviewsRouter from './backend/routes/reviews.js';
import ordersRouter from './backend/routes/orders.js';
import eventsRouter from './backend/routes/events.js';
import uploadRouter from './backend/routes/upload.js';
import passport from './backend/config/passport.js';
import { initAI } from './backend/services/aiInit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const REACT_BUILD_DIR = path.join(__dirname, 'frontend', 'build');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

const isProd = process.env.NODE_ENV === 'production';

// Debug: Log important paths (dev only)
if (!isProd) {
  console.log('📁 Directory paths:');
  console.log('   - PUBLIC_DIR:', PUBLIC_DIR);
  console.log('   - REACT_BUILD_DIR:', REACT_BUILD_DIR);
  console.log('   - REACT_BUILD exists:', fs.existsSync(REACT_BUILD_DIR));
  console.log('   - index.html exists:', fs.existsSync(path.join(PUBLIC_DIR, 'index.html')));
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOADS_DIR);
}
const BOOKS_COVERS_DIR = path.join(UPLOADS_DIR, 'books');
if (!fs.existsSync(BOOKS_COVERS_DIR)) {
  fs.mkdirSync(BOOKS_COVERS_DIR, { recursive: true });
}

const app = express();
let server;

app.disable('x-powered-by');

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Core middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, maxAge: 24*60*60*1000 }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Parsers
app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve React build files first (CSS, JS, static assets)
if (fs.existsSync(REACT_BUILD_DIR)) {
  app.use('/static', express.static(path.join(REACT_BUILD_DIR, 'static'), {
    maxAge: isProd ? '1y' : '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      // Hashed/static assets: cache aggressively in production
      if (isProd) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  
  // Serve React build root files (fonts, etc.)
  app.use(express.static(REACT_BUILD_DIR, {
    maxAge: isProd ? '1y' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.toLowerCase().endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
        return;
      }
      if (isProd && filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (!isProd) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    }
  }));
}

// Static assets (CSS, JS, images) - only for specific paths
app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets'), {
  maxAge: isProd ? '7d' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.toLowerCase().endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
      return;
    }
    // Images/fonts can be cached longer
    if (isProd && filePath.toLowerCase().match(/\.(png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30d
    }
  }
}));

// Static uploads — thư mục public/uploads, URL /uploads/...
app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads'), {
  maxAge: isProd ? '7d' : '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.toLowerCase().endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  },
}));

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Favicon route (serve before catch-all)
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(PUBLIC_DIR, 'assets', 'img', 'favicon.png');
  if (fs.existsSync(faviconPath)) {
    return res.sendFile(faviconPath);
  }
  res.status(204).end(); // No Content
});

// Dashboard stats API (for React Admin dashboard)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const [products, users, orders, contacts, reviews, posts] = await Promise.all([
      db.collection('products').countDocuments(),
      db.collection('users').countDocuments(),
      db.collection('orders').countDocuments(),
      db.collection('contacts').countDocuments(),
      db.collection('reviews').countDocuments(),
      db.collection('posts').countDocuments(),
    ]);
    res.json({ products, users, orders, contacts, reviews, posts });
  } catch {
    res.json({ products: 0, users: 0, orders: 0, contacts: 0, reviews: 0, posts: 0 });
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/products', productsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/events', eventsRouter);
app.use('/api', reviewsRouter);   

// Explicit route for root path - Serve React build
app.get('/', (req, res) => {
  const reactIndex = path.join(REACT_BUILD_DIR, 'index.html');
  if (fs.existsSync(reactIndex)) {
    if (!isProd) console.log('⚛️  [ROOT] Serving React app');
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(reactIndex);
  }
  // Fallback to static HTML if React build not found
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (!isProd) console.log('📄 [ROOT] Serving public/index.html (fallback)');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(indexPath);
});

// Serve React app for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Skip static files (favicon, robots.txt, etc.)
  const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.txt', '.xml', '.json'];
  const isStaticFile = staticExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
  if (isStaticFile) {
    return next(); // Let express.static handle it
  }

  // Priority 1: Serve React app if build files exist (ƯU TIÊN CAO NHẤT)
  if (fs.existsSync(REACT_BUILD_DIR)) {
    const reactIndex = path.join(REACT_BUILD_DIR, 'index.html');
    if (fs.existsSync(reactIndex)) {
      if (!isProd) console.log('⚛️  Serving React app for:', req.path);
      res.setHeader('Cache-Control', 'no-store');
      return res.sendFile(reactIndex);
    }
  }

  // Priority 2: Serve static HTML files from public/
  // For root path, serve index.html
  if (req.path === '/') {
    const indexFile = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexFile)) {
      console.log('📄 Serving public/index.html');
      return res.sendFile(indexFile);
    }
  }

  // Priority 3: Try to find .html file matching the path
  // Remove leading slash and add .html extension
  const htmlPath = req.path.slice(1); // Remove leading /
  const htmlFile = path.join(PUBLIC_DIR, htmlPath.endsWith('.html') ? htmlPath : `${htmlPath}.html`);
  
  if (fs.existsSync(htmlFile)) {
    if (!isProd) console.log('📄 Serving HTML file:', htmlFile);
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(htmlFile);
  }

  // Priority 4: Fallback to index.html for client-side routing (SPA style)
  // This allows routes like /shop, /about, /contact to work
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    if (!isProd) console.log('📄 Serving index.html for route:', req.path);
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(indexFile);
  }

  // Priority 5: 404 fallback (if index.html doesn't exist)
  console.log('❌ File not found:', req.path);
  const file404 = path.join(PUBLIC_DIR, '404.html');
  if (fs.existsSync(file404)) {
    return res.status(404).sendFile(file404);
  }
  
  res.status(404).send('404 Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Path:', req.path);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start
(async () => {
  try {
    await connectDB();
    await initAI();

    const PORT = process.env.PORT || 3000;

    server = app.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`🔧 React Admin: http://localhost:${PORT}/admin`);
      console.log('📁 PUBLIC_DIR:', PUBLIC_DIR);
    });

    // Handle port already in use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the existing process or use a different port.`);
        console.log(`💡 Try: netstat -ano | findstr :${PORT} to find the process using the port`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err.message);
        process.exit(1);
      }
    });

  } catch (e) {
    console.error('❌ Failed to start:', e.message);
    process.exit(1);
  }
})();

// Graceful shutdown
['SIGTERM','SIGINT','SIGQUIT'].forEach(sig => {
  process.on(sig, async () => {
    console.log(`\n🔄 Shutting down (${sig})...`);
    try {
      if (server) await new Promise(r => server.close(r));
      process.exit(0);
    } catch (e) {
      console.error('❌ Shutdown error:', e.message);
      process.exit(1);
    }
  });
});
