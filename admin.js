// admin.js
import AdminJS, { ComponentLoader } from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';
import uploadFeature from '@adminjs/upload';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

// Models
import Product from './backend/models/Product.js';
import User from './backend/models/User.js';
import Author from './backend/models/Author.js';
import Post from './backend/models/Post.js';
import Contact from './backend/models/Contact.js';
import Review from './backend/models/Review.js';

// Configs
import { CATEGORY_CONFIG } from './backend/config/categories.js';

// --- 1. SETUP & CONFIGURATION ---
AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const componentLoader = new ComponentLoader();

// Paths
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const UPLOAD_BUCKET = path.join(process.cwd(), 'public', 'uploads');
const LOCAL_TMP_DIR = path.join(process.cwd(), '.tmp_uploads');

// Ensure dirs exist
[UPLOAD_BUCKET, LOCAL_TMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Fix Windows EXDEV error
process.env.TMPDIR = LOCAL_TMP_DIR;

// --- 2. HELPER FUNCTIONS ---

// Tạo slug cơ bản
const toSlug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

// Xử lý số liệu đầu vào (xóa dấu phẩy, khoảng trắng)
const coerceNumbers = (request, fields = ['price', 'stock', 'rating']) => {
  if (!request.payload) return request;
  fields.forEach((k) => {
    const v = request.payload[k];
    if (v) {
      const num = Number(String(v).replace(/\s/g, '').replace(/,/g, '.'));
      if (!Number.isNaN(num)) request.payload[k] = num;
    }
  });
  return request;
};

// Tạo Unique Slug (Dùng chung cho Product, Author, Post)
const ensureUniqueSlug = async (request, Model, sourceField = 'name') => {
  if (request.payload?.[sourceField] && !request.payload.slug) {
    let baseSlug = toSlug(request.payload[sourceField]);
    let slug = baseSlug;
    let counter = 1;
    const currentId = request.record?.id; // Bỏ qua chính nó khi edit

    // Tìm xem slug đã tồn tại chưa
    while (await Model.findOne({ slug, _id: { $ne: currentId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    request.payload.slug = slug;
  }
  return request;
};

// Tự động tạo danh sách Categories cho AdminJS từ file config
const getCategoryOptions = () => {
  const options = [];
  Object.values(CATEGORY_CONFIG).forEach(group => {
    group.children.forEach(child => {
      options.push({ value: child.id, label: `${group.display} > ${child.name}` });
    });
  });
  return options;
};

// Cấu hình Upload chung
const createUploadFeature = (fileProp, keyProp, folderName, multiple = false) => {
  return uploadFeature({
    componentLoader,
    provider: {
      local: {
        bucket: UPLOAD_BUCKET,
        baseUrl: PUBLIC_URL ? `${PUBLIC_URL.replace(/\/$/, '')}/uploads` : '/uploads'
      }
    },
    properties: { file: fileProp, key: keyProp },
    multiple: multiple,
    uploadPath: (record, filename) => {
      const safe = filename.replace(/\s+/g, '-');
      const rid = record?.id?.() || 'new';
      return `${folderName}/${rid}/${Date.now()}-${safe}`;
    },
    validation: { mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
  });
};

// --- 3. RESOURCES CONFIGURATION ---

export const adminJs = new AdminJS({
  rootPath: '/admin',
  componentLoader,
  branding: {
    companyName: 'Bookle Admin',
    withMadeWithLove: false,
  },
  locale: {
    language: 'vi',
    availableLanguages: ['vi', 'en'],
    translations: {
      labels: { Product: 'Sách', User: 'Người dùng', Author: 'Tác giả', Post: 'Tin tức', Contact: 'Liên hệ', Review: 'Đánh giá' },
      actions: { new: 'Thêm mới', edit: 'Sửa', show: 'Xem', delete: 'Xóa', list: 'Danh sách' }
    }
  },
  resources: [
    // --- USER ---
    {
      resource: User,
      options: {
        properties: {
          password: { isVisible: { list: false, show: false, edit: true, filter: false }, type: 'password' },
          role: { availableValues: [{ value: 'user', label: 'Khách hàng' }, { value: 'admin', label: 'Quản trị viên' }] },
          emailVerificationToken: { isVisible: false },
          passwordResetToken: { isVisible: false },
          wishlist: { isVisible: false },
        },
        listProperties: ['name', 'email', 'role', 'isActive', 'createdAt'],
        editProperties: ['name', 'email', 'password', 'phone', 'role', 'isActive']
      }
    },

    // --- PRODUCT ---
    {
      resource: Product,
      options: {
        properties: {
          description: { type: 'richtext' }, // Gợi ý: Dùng richtext cho mô tả đẹp hơn
          categories: {
            isArray: true,
            availableValues: getCategoryOptions(), // ✅ DRY: Load từ config
          },
          price: { type: 'currency', props: { style: { maxWidth: 200 } } },
          uploadImages: { isVisible: { list: false, show: false, edit: true } },
          images: { isVisible: { list: true, show: true, edit: false } }
        },
        actions: {
          new: { before: async (req) => { await ensureUniqueSlug(req, Product); coerceNumbers(req); return req; } },
          edit: { before: async (req) => { await ensureUniqueSlug(req, Product); coerceNumbers(req); return req; } }
        }
      },
      features: [createUploadFeature('uploadImages', 'images', 'products', true)],
    },

    // --- AUTHOR ---
    {
      resource: Author,
      options: {
        properties: {
          bio: { type: 'textarea' },
          uploadAvatar: { isVisible: { list: false, show: false, edit: true } },
          uploadImages: { isVisible: { list: false, show: false, edit: true } }
        },
        actions: {
          new: { before: async (req) => await ensureUniqueSlug(req, Author) },
          edit: { before: async (req) => await ensureUniqueSlug(req, Author) }
        }
      },
      features: [
        createUploadFeature('uploadAvatar', 'avatar', 'authors/avatar', false),
        createUploadFeature('uploadImages', 'images', 'authors/gallery', true)
      ],
    },

    // --- POST ---
    {
      resource: Post,
      options: {
        properties: {
          content: { type: 'richtext' },
          category: {
            availableValues: [
              { value: 'News', label: 'Tin tức' },
              { value: 'Blog', label: 'Blog' },
              { value: 'Events', label: 'Sự kiện' }
            ]
          },
          uploadFeaturedImage: { isVisible: { list: false, show: false, edit: true } }
        },
        actions: {
          new: { before: async (req) => { 
            if (req.payload?.isPublished && !req.payload.publishedAt) req.payload.publishedAt = new Date();
            return await ensureUniqueSlug(req, Post, 'title'); 
          }},
          edit: { before: async (req) => {
             if (req.payload?.isPublished && !req.payload.publishedAt) req.payload.publishedAt = new Date();
             return await ensureUniqueSlug(req, Post, 'title'); 
          }}
        }
      },
      features: [
        createUploadFeature('uploadFeaturedImage', 'featuredImage', 'posts/featured', false),
        createUploadFeature('uploadImages', 'images', 'posts/gallery', true)
      ],
    },

    // --- CONTACT & REVIEW (Giữ nguyên cấu hình cơ bản) ---
    { resource: Contact },
    { resource: Review }
  ],
});

// --- 4. AUTHENTICATION ---
const authenticate = async (email, password) => {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

  // Chỉ cho phép đăng nhập nếu có biến môi trường
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    console.error('❌ Thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD_HASH trong .env');
    return null;
  }

  if (email === ADMIN_EMAIL) {
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (isValid) return { email, role: 'admin' };
  }
  
  return null;
};

// --- 5. ROUTER EXPORT ---
export const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  { authenticate, cookieName: 'adminjs', cookiePassword: process.env.SESSION_SECRET || 'secure-cookie-password-change-me' },
  null,
  {
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'secure-cookie-secret-change-me',
    cookie: { 
        httpOnly: true, 
        sameSite: 'lax', 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 
    },
  }
);