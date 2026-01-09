// scripts/seedAuthors.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Author from '../models/Author.js';
import Product from '../models/Product.js';
import { connectDB } from '../db/index.js';

const sampleAuthors = [
  {
    name: 'Nguyễn Nhật Ánh',
    title: 'Nhà văn thiếu nhi',
    bio: 'Nguyễn Nhật Ánh là một nhà văn Việt Nam chuyên viết cho tuổi mới lớn. Ông được biết đến với nhiều tác phẩm nổi tiếng như "Kính vạn hoa", "Tôi thấy hoa vàng trên cỏ xanh", "Cây chuối non đi giày xanh".',
    avatar: '/assets/img/team/author-1.jpg',
    social: {
      facebook: 'https://www.facebook.com/nguyennhatanh',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Hội Nhà văn Việt Nam',
      'Giải thưởng Văn học thiếu nhi'
    ]
  },
  {
    name: 'Paulo Coelho',
    title: 'Nhà văn Brazil',
    bio: 'Paulo Coelho là một nhà văn người Brazil, tác giả của cuốn sách bán chạy nhất "Nhà giả kim" (The Alchemist). Ông được biết đến với những tác phẩm mang tính triết học và tâm linh sâu sắc.',
    avatar: '/assets/img/team/author-2.jpg',
    social: {
      facebook: 'https://www.facebook.com/paulocoelho',
      twitter: 'https://twitter.com/paulocoelho',
      instagram: 'https://www.instagram.com/paulocoelho',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Văn học Quốc tế',
      'Huân chương Văn hóa Pháp'
    ]
  },
  {
    name: 'Haruki Murakami',
    title: 'Nhà văn Nhật Bản',
    bio: 'Haruki Murakami là một trong những nhà văn đương đại nổi tiếng nhất của Nhật Bản. Tác phẩm của ông thường mang phong cách siêu thực và huyền bí, được dịch ra nhiều ngôn ngữ trên thế giới.',
    avatar: '/assets/img/team/author-3.jpg',
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Franz Kafka',
      'Giải thưởng Jerusalem'
    ]
  },
  {
    name: 'J.K. Rowling',
    title: 'Nhà văn Anh',
    bio: 'J.K. Rowling là tác giả của bộ truyện nổi tiếng "Harry Potter". Bộ truyện đã trở thành hiện tượng văn học toàn cầu và được chuyển thể thành phim thành công.',
    avatar: '/assets/img/team/author-4.jpg',
    social: {
      facebook: 'https://www.facebook.com/jkrowling',
      twitter: 'https://twitter.com/jk_rowling',
      instagram: 'https://www.instagram.com/jkrowling',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Hugo',
      'Giải thưởng Locus',
      'Huân chương Đế quốc Anh'
    ]
  },
  {
    name: 'Dan Brown',
    title: 'Nhà văn Mỹ',
    bio: 'Dan Brown là tác giả của nhiều tiểu thuyết trinh thám nổi tiếng như "Mật mã Da Vinci", "Thiên thần và Ác quỷ", "Hỏa ngục". Tác phẩm của ông thường kết hợp giữa lịch sử, tôn giáo và khoa học.',
    avatar: '/assets/img/team/author-5.jpg',
    social: {
      facebook: 'https://www.facebook.com/authordanbrown',
      twitter: 'https://twitter.com/authordanbrown',
      instagram: '',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Sách Quốc gia Mỹ'
    ]
  },
  {
    name: 'Nguyễn Du',
    title: 'Đại thi hào dân tộc',
    bio: 'Nguyễn Du là đại thi hào dân tộc Việt Nam, tác giả của "Truyện Kiều" - một kiệt tác văn học được coi là tác phẩm văn học lớn nhất của Việt Nam. Ông được UNESCO công nhận là Danh nhân văn hóa thế giới.',
    avatar: '/assets/img/team/author-6.jpg',
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    awards: [
      'Danh nhân văn hóa thế giới UNESCO'
    ]
  },
  {
    name: 'Stephen King',
    title: 'Nhà văn kinh dị Mỹ',
    bio: 'Stephen King là một trong những nhà văn kinh dị và giả tưởng nổi tiếng nhất thế giới. Ông đã xuất bản hơn 60 tiểu thuyết và hơn 200 truyện ngắn, nhiều tác phẩm đã được chuyển thể thành phim.',
    avatar: '/assets/img/team/author-7.jpg',
    social: {
      facebook: 'https://www.facebook.com/stephenking',
      twitter: 'https://twitter.com/stephenking',
      instagram: '',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Bram Stoker',
      'Giải thưởng World Fantasy',
      'Huân chương Nghệ thuật Quốc gia Mỹ'
    ]
  },
  {
    name: 'Ngô Tất Tố',
    title: 'Nhà văn hiện thực',
    bio: 'Ngô Tất Tố là nhà văn, nhà báo, nhà nghiên cứu văn học Việt Nam. Ông nổi tiếng với các tác phẩm như "Tắt đèn", "Việc làng" phản ánh hiện thực xã hội Việt Nam đầu thế kỷ 20.',
    avatar: '/assets/img/team/author-8.jpg',
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    awards: [
      'Giải thưởng Hội Nhà văn Việt Nam'
    ]
  }
];

async function seedAuthors() {
  try {
    console.log('🔄 Đang kết nối database...');
    await connectDB();
    
    console.log('📚 Đang seed dữ liệu authors...');
    
    // Clear existing authors (optional - comment out if you want to keep existing)
    // await Author.deleteMany({});
    // console.log('🗑️  Đã xóa authors cũ');
    
    let created = 0;
    let skipped = 0;
    
    for (const authorData of sampleAuthors) {
      // Check if author already exists
      const existing = await Author.findOne({ name: authorData.name });
      
      if (existing) {
        console.log(`⏭️  Đã tồn tại: ${authorData.name}`);
        skipped++;
        continue;
      }
      
      const author = new Author(authorData);
      await author.save();
      console.log(`✅ Đã tạo: ${author.name} (${author.slug})`);
      created++;
    }
    
    // Also create authors from existing products
    console.log('\n📖 Đang tạo authors từ products...');
    const products = await Product.find({ isAvailable: true }).select('author');
    const uniqueAuthors = [...new Set(products.map(p => p.author).filter(Boolean))];
    
    for (const authorName of uniqueAuthors) {
      const existing = await Author.findOne({ name: authorName });
      
      if (!existing) {
        const author = new Author({
          name: authorName,
          title: 'Tác giả',
          bio: `Tác giả ${authorName}`
        });
        await author.save();
        console.log(`✅ Đã tạo từ product: ${authorName}`);
        created++;
      }
    }
    
    // Count books for each author
    console.log('\n📊 Đang đếm số sách cho mỗi tác giả...');
    const allAuthors = await Author.find({});
    for (const author of allAuthors) {
      const bookCount = await Product.countDocuments({ 
        author: author.name,
        isAvailable: true 
      });
      if (bookCount > 0) {
        console.log(`   ${author.name}: ${bookCount} cuốn sách`);
      }
    }
    
    console.log('\n✨ Hoàn thành!');
    console.log(`   ✅ Đã tạo: ${created} authors`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} authors (đã tồn tại)`);
    console.log(`   📚 Tổng số authors: ${await Author.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi seed authors:', error);
    process.exit(1);
  }
}

seedAuthors();

