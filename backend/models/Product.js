// models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  // Cơ bản
  name: { type: String, required: true, index: true },       
  slug: { type: String, unique: true, sparse: true },

  // Giá
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },                   

  // Ảnh
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
      // Legacy categories (for backward compatibility)
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
  featured: { type: Boolean, default: false },                // nổi bật

  // Đánh giá
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },

  // Mô tả
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },

  // Vector embedding for AI search (text-embedding-3-small produces 1536 dimensions)
  embedding: { 
    type: [Number], 
    default: [],
    select: false // Don't include in default queries to save bandwidth
  },
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);