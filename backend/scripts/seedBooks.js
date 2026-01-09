"use strict";

import dotenv from 'dotenv';
dotenv.config();
import Author from '../models/Author.js';
import Product from '../models/Product.js';
import { connectDB, disconnectDB } from '../db/index.js';

const sampleAuthors = [
  {
    name: 'Nguyễn Nhật Ánh',
    title: 'Nhà văn thiếu nhi',
    bio: 'Nguyễn Nhật Ánh nổi tiếng với nhiều tác phẩm dành cho thiếu nhi và tuổi mới lớn như "Kính vạn hoa", "Tôi thấy hoa vàng trên cỏ xanh".',
  },
  {
    name: 'Haruki Murakami',
    title: 'Nhà văn Nhật Bản',
    bio: 'Haruki Murakami được biết đến với phong cách siêu thực, tiêu biểu qua các tác phẩm "Rừng Na Uy", "Kafka bên bờ biển".',
  },
  {
    name: 'J.K. Rowling',
    title: 'Nhà văn Anh',
    bio: 'J.K. Rowling là tác giả bộ truyện "Harry Potter" tạo nên hiện tượng văn học toàn cầu.',
  },
  {
    name: 'Dan Brown',
    title: 'Nhà văn trinh thám',
    bio: 'Dan Brown nổi tiếng với các tiểu thuyết trinh thám kết hợp lịch sử và tôn giáo như "Mật mã Da Vinci", "Thiên thần và Ác quỷ".',
  },
  {
    name: 'Ngô Tất Tố',
    title: 'Nhà văn hiện thực',
    bio: 'Ngô Tất Tố là tác giả các tác phẩm hiện thực phê phán nổi tiếng như "Tắt đèn", "Việc làng".',
  },
];

const sampleBooks = [
  {
    name: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    author: 'Nguyễn Nhật Ánh',
    price: 96000,
    compareAtPrice: 120000,
    publisher: 'NXB Trẻ',
    isbn: '9786042085005',
    pages: 394,
    language: 'vi',
    publishedAt: new Date('2010-05-15'),
    categories: ['thieu-nhi', 'tieu-thuyet'],
    genres: ['văn học thiếu nhi', 'đời sống'],
    stock: 150,
    isAvailable: true,
    featured: true,
    shortDescription: 'Câu chuyện tuổi thơ tại vùng quê nghèo Phú Yên với những ký ức trong trẻo và xúc động.',
    description: 'Cuốn tiểu thuyết nổi tiếng của Nguyễn Nhật Ánh đưa người đọc trở về tuổi thơ với những câu chuyện dung dị, cảm động về tình anh em, tình bạn và tình quê.',
  },
  {
    name: 'Rừng Na Uy',
    author: 'Haruki Murakami',
    price: 132000,
    compareAtPrice: 165000,
    publisher: 'NXB Hội Nhà Văn',
    isbn: '9786045383245',
    pages: 440,
    language: 'vi',
    publishedAt: new Date('1987-09-04'),
    categories: ['tieu-thuyet', 'lang-man'],
    genres: ['văn học Nhật Bản', 'tâm lý'],
    stock: 80,
    isAvailable: true,
    shortDescription: 'Tiểu thuyết trưởng thành nổi tiếng với giọng kể trữ tình và sâu sắc.',
    description: 'Haruki Murakami dẫn dắt người đọc qua câu chuyện tình yêu và mất mát của Toru Watanabe, phản ánh thế hệ trẻ Nhật Bản trong những năm 1960.',
  },
  {
    name: 'Harry Potter Và Hòn Đá Phù Thủy',
    author: 'J.K. Rowling',
    price: 105000,
    compareAtPrice: 150000,
    publisher: 'NXB Trẻ',
    isbn: '9780747532699',
    pages: 336,
    language: 'vi',
    publishedAt: new Date('1997-06-26'),
    categories: ['thieu-nhi', 'gia-tuong'],
    genres: ['fantasy', 'phiêu lưu'],
    stock: 200,
    isAvailable: true,
    isHot: true,
    shortDescription: 'Khởi đầu hành trình phép thuật của cậu bé Harry Potter tại trường Hogwarts.',
    description: 'Tập đầu tiên của series Harry Potter giới thiệu thế giới phù thủy đầy màu sắc và những bí ẩn xoay quanh Hòn đá Phù thủy.',
  },
  {
    name: 'Mật Mã Da Vinci',
    author: 'Dan Brown',
    price: 142000,
    compareAtPrice: 178000,
    publisher: 'NXB Văn Hóa Sài Gòn',
    isbn: '9780385504201',
    pages: 512,
    language: 'vi',
    publishedAt: new Date('2003-03-18'),
    categories: ['trinh-tham', 'kinh-di'],
    genres: ['trinh thám', 'bí ẩn'],
    stock: 95,
    isAvailable: true,
    shortDescription: 'Cuộc truy tìm bí mật tôn giáo kéo dài hàng thế kỷ cùng biểu tượng học Robert Langdon.',
    description: 'Tiểu thuyết ly kỳ của Dan Brown kết hợp những bí ẩn tôn giáo, lịch sử nghệ thuật và hành trình giải mã những mật mã cổ xưa.',
  },
  {
    name: 'Tắt Đèn',
    author: 'Ngô Tất Tố',
    price: 75000,
    compareAtPrice: 90000,
    publisher: 'NXB Văn Học',
    isbn: '9786049586208',
    pages: 220,
    language: 'vi',
    publishedAt: new Date('1937-01-01'),
    categories: ['tieu-thuyet', 'xa-hoi'],
    genres: ['hiện thực phê phán'],
    stock: 60,
    isAvailable: true,
    shortDescription: 'Bức tranh hiện thực xã hội Việt Nam đầu thế kỷ 20 qua gia đình chị Dậu.',
    description: 'Tác phẩm tiêu biểu của Ngô Tất Tố lên án chế độ sưu thuế phong kiến hà khắc và số phận bi thảm của người nông dân.',
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function seedAuthors() {
  let created = 0;
  let skipped = 0;

  for (const authorData of sampleAuthors) {
    const existing = await Author.findOne({ name: authorData.name });

    if (existing) {
      skipped++;
      continue;
    }

    const author = new Author(authorData);
    await author.save();
    created++;
  }

  return { created, skipped };
}

async function seedBooks() {
  let created = 0;
  let skipped = 0;

  for (const bookData of sampleBooks) {
    const existing = await Product.findOne({ name: bookData.name });
    if (existing) {
      skipped++;
      continue;
    }

    const product = new Product({
      ...bookData,
      slug: slugify(bookData.name),
      images: [],
    });

    await product.save();
    created++;
  }

  return { created, skipped };
}

async function main() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await connectDB();

    console.log('✍️  Đang seed tác giả...');
    const authorsResult = await seedAuthors();
    console.log(`   ✅ Tạo mới: ${authorsResult.created}`);
    console.log(`   ⏭️  Bỏ qua: ${authorsResult.skipped}`);

    console.log('\n📚 Đang seed sách...');
    const booksResult = await seedBooks();
    console.log(`   ✅ Tạo mới: ${booksResult.created}`);
    console.log(`   ⏭️  Bỏ qua: ${booksResult.skipped}`);

    const totalAuthors = await Author.countDocuments();
    const totalBooks = await Product.countDocuments();

    console.log('\n✨ Hoàn thành seed dữ liệu!');
    console.log(`   👥 Tổng tác giả: ${totalAuthors}`);
    console.log(`   📘 Tổng sách: ${totalBooks}`);
  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

main();


