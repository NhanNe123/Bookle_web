// models/Product.js
import mongoose from 'mongoose';
import Counter from './Counter.js';

async function getNextSequence(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc.seq;
}

function skuPrefixFromDate(date = new Date()) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `BK${yy}${mm}`; // Bookle + YYMM
}

const ProductSchema = new mongoose.Schema({
  // Cơ bản
  name: { type: String, required: true, index: true },       
  slug: { type: String, unique: true, sparse: true },
  sku: { type: String, unique: true, sparse: true, index: true }, // Mã sản phẩm

  // Giá
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },                  

  // Ảnh (Lưu thẳng URL công khai, VD: /uploads/abc.jpg)
  coverImage: { type: String, default: '' },
  images: { type: [String], default: [] },

  // Metadata sách
  author: { type: String, index: true },
  publisher: { type: String },
  isbn: { type: String, index: true },
  pages: { type: Number, min: 1 },
  language: { type: String, default: 'vi' },
  publishedAt: { type: Date },

  // Phân loại
  categories: {
    type: [String],
    enum: [
      // Văn học – Nghệ thuật
      'tieu-thuyet','trinh-tham','lang-man','kinh-di','tho','light-novel','van-hoc-nuoc-ngoai',
      // Kinh tế – Kinh doanh
      'quan-tri','khoi-nghiep','marketing','dau-tu-tai-chinh','ban-hang','kinh-te-hoc',
      // Khoa học – Công nghệ
      'khoa-hoc-tu-nhien','cong-nghe-thong-tin','ai-machine-learning','ky-thuat','toan-hoc',
      // Lịch sử – Chính trị – Xã hội
      'lich-su-the-gioi','lich-su-viet-nam','chinh-tri-phap-luat','triet-hoc','xa-hoi-hoc',
      // Tâm lý – Kỹ năng sống
      'tam-ly-hoc','tam-linh','ky-nang-giao-tiep','phat-trien-ban-than','thien-song-toi-gian',
      // Thiếu nhi – Giáo dục
      'truyen-tranh','sach-mau','giao-trinh','sach-hoc-tieng-anh','stem-cho-tre',
      // Legacy categories
      'thieu-nhi','tham-khao','khac','khoa-hoc','lich-su','chinh-tri','cong-nghe',
      'gia-tuong','vien-tuong','tieu-su','kinh-doanh','ton-giao','nau-an','nghe-thuat',
      'du-lich','giao-duc','luat','kinh-te','xa-hoi','doi-song'
    ],
    default: []
  },
  genres: { type: [String], index: true, default: [] },      

  // Kho & hiển thị
  stock: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true, index: true },
  isHot: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },

  // Đánh giá
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },

  // Mô tả
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },

  // Vector embedding cho AI search
  embedding: { 
    type: [Number], 
    default: [],
    select: false
  },
}, { timestamps: true });

// Tự động tạo SKU khi thêm mới sản phẩm
ProductSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.sku) {
      const prefix = skuPrefixFromDate(this.createdAt || new Date());
      const key = `product:${prefix}`; 
      const seq = await getNextSequence(key);
      this.sku = `${prefix}-${String(seq).padStart(5, '0')}`;
    }
    next();
  } catch (e) {
    next(e);
  }
});

export default mongoose.model('Product', ProductSchema);