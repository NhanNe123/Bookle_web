"use strict";

import dotenv from 'dotenv';
dotenv.config();
import Product from '../models/Product.js';
import { connectDB, disconnectDB } from '../db/index.js';

// Mapping tên sản phẩm -> tên file hình ảnh (đúng với tên file thực tế)
const productImageMap = {
  // ========== VĂN HỌC – NGHỆ THUẬT ==========
  'Tôi Thấy Hoa Vàng Trên Cỏ Xanh': 'cho-toi-xin-mot-ve-di-tuoi-tho-phien-ban-mau-dac-biet-co-minh-hoa.jpg',
  'Mật Mã Da Vinci': 'Mật Mã Da Vinci.jpg',
  'Rừng Na Uy': 'Rừng Na Uy.jpg',
  'It': 'IT - Chú Hề Ma Quái.jpg',
  'Sword Art Online - Tập 1': 'Sword Art Online - Tập 1.jpg',
  '1984': '1984.jpg',
  'Mắt Biếc': 'Mắt Biếc.jpg',
  'Cho Tôi Xin Một Vé Đi Tuổi Thơ': 'cho-toi-xin-mot-ve-di-tuoi-tho-phien-ban-mau-dac-biet-co-minh-hoa.jpg',
  'Cô Gái Đến Từ Hôm Qua': 'Cô Gái Đến Từ Hôm.jpg',
  'Kafka Bên Bờ Biển': 'Kafka Bên Bờ Biển.jpg',
  '1Q84': '1Q84.jpg',
  'Biên Niên Ký Chim Vặn Dây Cót': 'Biên Niên Ký Chim Vặn.jpg',
  'Nhà Giả Kim': 'Nhà Gia Kim.jpg',
  'Anh Em Nhà Karamazov': 'Anh Em Nha Karamazov.jpg',
  'Chiến Tranh Và Hòa Bình': 'Chiến Tranh Và Hòa Bình.jpg',
  'Anna Karenina': 'Anna Karenina.jpg',
  'Kiêu Hãnh Và Định Kiến': 'Kieu Hanh Va Định.jpg',
  'Jane Eyre': 'Jane Eyre.jpg',
  'Những Người Khốn Khổ': 'Những Người Khon Khổ.jpg',
  'Bá Tước Monte Cristo': 'Bá Tước Monte Cristo.jpg',
  'Biểu Tượng Thất Truyền': 'Biểu Tượng Thất Truyền.jpg',
  'Nguồn Cội': 'Nguồn Cội.jpg',
  'Sherlock Holmes Toàn Tập': 'Sherlock Holmes Toàn.jpg',
  'Mười Người Da Đen Nhỏ': 'Mưoi Ngưoi Da Đen Nhỏ.jpg',
  'Cô Gái Có Hình Xăm Rồng': 'Cô Gái Có Hình Xăm.jpg',
  'Im Lặng Của Bầy Cừu': 'Im Lặng Của Bầy Cừu.jpg',
  
  // ========== LÃNG MẠN ==========
  'Bên Nhau Trọn Đời': 'bennhautrondoi.jpg',
  'Sam Sam Đến Rồi': 'Sam Sam Đến Rồi.jpg',
  'Bước Chậm Lại Giữa Thế Gian Vội Vã': 'buoc-cham-lai-giua-the-gian-voi-va.jpg',
  'Một Litre Nước Mắt': 'Một Litre Nước Mắt.jpg',
  'Call Me By Your Name': 'Call Me By Your Name.jpg',
  'Me Before You': 'Me Before You.jpg',
  
  // ========== KINH DỊ ==========
  'IT - Chú Hề Ma Quái': 'IT - Chú Hề Ma Quái.jpg',
  'Nghĩa Địa Thú Cưng': 'Nghĩa Địa Thú Cưng.jpg',
  'Dracula': 'Dracula.jpg',
  'Frankenstein': 'Frankenstein.jpg',
  'Bóng Ma Trong Nhà Hát': 'bong-ma-trong-nha-hat.jpg',
  
  // ========== LIGHT NOVEL ==========
  'Re:Zero': 'ReZero.jpg',
  'Overlord': 'Overlord.jpg',
  'Konosuba': 'Konosuba.jpg',
  'Mushoku Tensei': 'Mushoku Tensei.jpg',
  
  // ========== KINH TẾ – KINH DOANH ==========
  'Khởi Nghiệp Tinh Gọn': 'Khởi Nghiệp Tinh Gọn.jpg',
  'Marketing 4.0': 'Marketing 4.0.jpg',
  'Nhà Đầu Tư Thông Minh': 'Nhà Đầu Tư Thông.jpg',
  'Nghệ Thuật Bán Hàng': 'Nghệ Thuật Bán Hàng.jpg',
  'Kinh Tế Học Vĩ Mô': 'Kinh Tế Học Vĩ Mô.jpg',
  'Chiến Lược Đại Dương Xanh': 'Chiến Lược Đại Dương.jpg',
  'Lãnh Đạo 360 Độ': 'Lãnh Đạo 360 Độ.jpg',
  'Khởi Sự Kinh Doanh': 'Khởi Sự Kinh Doanh.jpg',
  'Công Ty Khởi Nghiệp 100$': 'Khoi-nghiep-voi-100.jpg',
  'Startup Nation': 'Startup Nation.jpg',
  'Cha Giàu Cha Nghèo': 'sach-rich-dad-poor-dad-tac-gia.jpg',
  'Dạy Con Làm Giàu': 'day-con-lam-giau-tap.jpg',
  'Người Giàu Nhất Thành Babylon': 'Người Giau Nhất Thành.jpg',
  'Contagious - Tạo Đà Lan Truyền': 'Contagious - Tao Đà Lan.jpg',
  'Made To Stick': 'Made To Stick,jpg.jpeg',
  'Influence - Sức Mạnh Thuyết Phục': 'Influence - Sức Mạnh.jpg',
  
  // ========== KHOA HỌC – CÔNG NGHỆ ==========
  'Vũ Trụ Trong Vỏ Hạt Dẻ': 'Lược Sử Thời Gian.jpg',
  'Lược Sử Thời Gian': 'Lược Sử Thời Gian.jpg',
  'Cosmos': 'Cosmos.jpg',
  'Nguồn Gốc Các Loài': 'Nguồn Gốc Các Loài.jpg',
  'Lịch Sử Ngắn Gọn Của Vạn Vật': 'Lịch Sử Ngắn Gọn Của.jpg',
  'Astrophysics For People In A Hurry': 'Astrophysics For People.jpg',
  'Clean Code': 'Clean Code.jpg',
  'Machine Learning Yearning': 'Machine Learning.jpg',
  'Kỹ Thuật Điện Tử Cơ Bản': 'Kỹ Thuật Điện Tử Cơ.jpg',
  'Toán Học Cao Cấp': 'Giáo Trình Toán Cao.jpg',
  'Design Patterns': 'Design Patterns.jpg',
  'Code Complete': 'Code Complete.jpg',
  'Cracking The Coding Interview': 'Cracking The Coding.jpg',
  'Introduction To Algorithms': 'Introduction To.jpg',
  'Head First Design Patterns': 'Head First Design.jpg',
  'Refactoring': 'Refactoring.jpg',
  'Deep Learning': 'Deep Learning.jpg',
  'Hands-On Machine Learning': 'Hands-On Machine.jpg',
  'Pattern Recognition': 'Pattern Recognition.jpg',
  'AI Superpowers': 'Al Superpowers.jpg',
  'Life 3.0': 'Life 3.0.jpg',
  'Human Compatible': 'Human Compatible.jpg',
  'Superintelligence': 'Superintelligence.jpg',
  
  // ========== LỊCH SỬ – CHÍNH TRỊ – XÃ HỘI ==========
  'Lịch Sử Thế Giới': 'Lịch Sử Thế Giới.jpg',
  'Đại Việt Sử Ký Toàn Thư': 'Lịch Sử Việt Nam.jpg',
  'Chính Trị Luận': 'Giáo Trình Pháp Luật.jpg',
  'Triết Học Phương Đông': 'Giao Trình Triết Học.jpg',
  'Sapiens - Lược Sử Loài Người': 'Sapiens - Lược Sử Loài.jpg',
  'Homo Deus': 'Homo Deus.jpg',
  '21 Bài Học Cho Thế Kỷ 21': '21baihocchotheki21.jpg',
  'Câu Chuyện Triết Học': 'Câu Chuyện Triết Học.jpg',
  'Lịch Sử Việt Nam': 'Lịch Sử Việt Nam.jpg',
  'Ngàn Năm Áo Mũ': 'Ngàn Năm Áo Mũ.jpg',
  'Người Việt Gốc Miên': 'Người Việt Gốc Miên.jpg',
  'Lịch Sử Họ Nguyễn': 'Lịch Sử Họ Nguyễn.jpg',
  
  // ========== TÂM LÝ – KỸ NĂNG SỐNG ==========
  'Tâm Lý Học Đám Đông': 'Mindset - Tâm Lý Học.jpg',
  'Sức Mạnh Của Tĩnh Lặng': 'buoc-cham-lai-giua-the-gian-voi-va.jpg',
  'Đắc Nhân Tâm': 'dam-nghi-lon.jpg',
  '7 Thói Quen Của Người Thành Đạt': '7thoiquen.jpg',
  'Lối Sống Tối Giản': 'Lối Sống Tối Giản.jpg',
  'Quẳng Gánh Lo Đi Và Vui Sống': 'Sach-quang-ganh-lo-di-va-vui-song.jpg',
  'Outliers - Những Kẻ Xuất Chúng': 'Outliers - Những Kẻ.jpg',
  'Grit - Sức Mạnh Đam Mê': 'Grit - Sức Mạnh Đam Mê.jpg',
  'Mindset - Tâm Lý Học Thành Công': 'Mindset - Tâm Lý Học.jpg',
  'Atomic Habits - Thay Đổi Tí Hon': 'Atomic Habits - Thay Đổi.jpg',
  'Không Bao Giờ Là Thất Bại': 'Không Bao Giờ Là.jpg',
  'Eat That Frog - Ăn Con Ếch': 'Eat That Frog - Ăn Con.jpg',
  'Deep Work - Làm Ra Làm': 'Deep Work - Làm Ra.jpg',
  'Essentialism - Chủ Nghĩa Tối Giản': 'Essentialism - Chủ Nghĩa.jpg',
  'Dám Nghĩ Lớn': 'dam-nghi-lon.jpg',
  'Nghệ Thuật Của Sự Tĩnh Lặng': 'Nghệ Thuật Của Sự.jpg',
  'Phép Màu Của Sự Dọn Dẹp': 'Phép Màu Của Sự Dọn.jpg',
  'Ikigai - Bí Quyết Sống Lâu': 'Ikigai - Bí Quyết Sống Lâu.jpg',
  'Nghệ Thuật Quản Lý Thời Gian': 'thuat-quan-ly-thoi-gian.jpg',
  
  // ========== THIẾU NHI – GIÁO DỤC ==========
  'Doraemon - Tập 1': 'Doraemon - Tập 1.jpg',
  'Sách Tô Màu Cho Bé - Động Vật': 'Sách Tô Màu Cho Bé.jpg',
  'Giáo Trình Toán Lớp 1': 'Giáo Trình Toán Lớp 1.jpg',
  'English For Kids - Tập 1': 'English For Kids - Tập 1.jpg',
  'STEM Cho Trẻ - Robotics Cơ Bản': 'STEM Cho Tre - Robotics.jpg',
  'Conan Tập 1': 'Conan Tập 1.jpg',
  'One Piece Tập 1': 'One Piece Tập 1.jpg',
  'Naruto Tập 1': 'Naruto Tập 1.jpg',
  'Dragon Ball Tập 1': 'Dragon Ball Tập 1.jpg',
  'Shin - Cậu Bé Bút Chì Tập 1': 'Shin - Cậu Bé Bút Chì.jpg',
  'Slam Dunk Tập 1': 'Slam Dunk Tập 1.jpg',
  'Attack on Titan Tập 1': 'Attack on Titan Tập 1.jpg',
  
  // ========== HỌC NGOẠI NGỮ ==========
  'English Grammar In Use': 'English Grammar In Use.jpg',
  'Oxford Word Skills': 'Oxford Word Skills.jpg',
  'IELTS Cambridge 18': 'IELTS Cambridge 18.jpg',
  'Destination B2': 'Destination B2.jpg',
  'English Vocabulary In Use': 'English-Vocabulary-in-Use-Elementary.jpg',
  'Pronunciation In Use': 'Pronunciation In Use.jpg',
  'Collocations In Use': 'Collocations In Use.jpg',
  
  // ========== GIÁO TRÌNH ==========
  'Giáo Trình Toán Cao Cấp': 'Giáo Trình Toán Cao.jpg',
  'Giáo Trình Vật Lý Đại Cương': 'Giáo Trình Vật Lý Đại.jpg',
  'Giáo Trình Hóa Học Đại Cương': 'Giáo Trình Hóa Học Đại.jpg',
  'Giáo Trình Kinh Tế Vĩ Mô': 'Giáo Trình Kinh Tế Vĩ.jpg',
  'Giáo Trình Triết Học Mác - Lênin': 'Giao Trình Triết Học.jpg',
  'Giáo Trình Kế Toán Tài Chính': 'Giáo Trình Kế Toán Tài.jpg',
  'Giáo Trình Marketing Căn Bản': 'Giáo Trình Marketing.jpg',
  'Giáo Trình Pháp Luật Đại Cương': 'Giáo Trình Pháp Luật.jpg',
};

async function updateProductImages() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await connectDB();

    console.log('\n🖼️  Đang cập nhật hình ảnh sản phẩm...');
    let updated = 0;
    let notFound = 0;
    let noMapping = 0;

    // Lấy tất cả products
    const products = await Product.find({});
    console.log(`📚 Tìm thấy ${products.length} sản phẩm trong database\n`);

    for (const product of products) {
      const imageName = productImageMap[product.name];
      
      if (imageName) {
        // Cập nhật hình ảnh mới (không encode để giữ tên file gốc)
        const newImagePath = `/uploads/products/${imageName}`;
        
        await Product.updateOne(
          { _id: product._id },
          { $set: { images: [newImagePath] } }
        );
        
        console.log(`   ✅ Đã cập nhật: ${product.name}`);
        console.log(`      Image: ${newImagePath}`);
        updated++;
      } else {
        console.log(`   ⏭️  Không có mapping: ${product.name}`);
        noMapping++;
      }
    }

    console.log('\n✨ Hoàn thành cập nhật hình ảnh!');
    console.log(`   ✅ Đã cập nhật: ${updated} sản phẩm`);
    console.log(`   ⏭️  Không có mapping: ${noMapping} sản phẩm`);

  } catch (error) {
    console.error('❌ Lỗi cập nhật hình ảnh:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

updateProductImages();
