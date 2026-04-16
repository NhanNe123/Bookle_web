// scripts/seedAuthors.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Author from '../models/Author.js';
import Product from '../models/Product.js';
import { connectDB } from '../db/index.js';

const sampleAuthors = [
  // ===== TÁC GIẢ VIỆT NAM =====
  {
    name: 'Nguyễn Nhật Ánh',
    title: 'Nhà văn thiếu nhi nổi tiếng',
    bio: 'Nguyễn Nhật Ánh (sinh năm 1955) là một nhà văn Việt Nam chuyên viết cho tuổi mới lớn. Ông được biết đến với nhiều tác phẩm nổi tiếng như "Kính vạn hoa", "Tôi thấy hoa vàng trên cỏ xanh", "Mắt biếc", "Cây chuối non đi giày xanh". Ông là một trong những nhà văn có sách bán chạy nhất Việt Nam với hàng triệu bản in được tiêu thụ.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    social: { facebook: 'https://facebook.com/nguyennhatanh' },
    awards: ['Giải thưởng Hội Nhà văn Việt Nam', 'Giải thưởng ASEAN', 'Giải Sách hay 2017']
  },
  {
    name: 'Nam Cao',
    title: 'Nhà văn hiện thực xuất sắc',
    bio: 'Nam Cao (1915-1951) là một trong những nhà văn hiện thực xuất sắc nhất của văn học Việt Nam hiện đại. Tác phẩm của ông phản ánh sâu sắc cuộc sống và số phận của người nông dân Việt Nam trước Cách mạng tháng Tám. Các tác phẩm tiêu biểu: "Chí Phèo", "Lão Hạc", "Đời thừa".',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    awards: ['Giải thưởng Hồ Chí Minh về Văn học Nghệ thuật']
  },
  {
    name: 'Nguyễn Du',
    title: 'Đại thi hào dân tộc',
    bio: 'Nguyễn Du (1765-1820) là đại thi hào dân tộc Việt Nam, tác giả của "Truyện Kiều" - kiệt tác văn học được coi là tác phẩm văn học lớn nhất của Việt Nam. Năm 2013, UNESCO công nhận Nguyễn Du là Danh nhân văn hóa thế giới nhân kỷ niệm 250 năm ngày sinh của ông.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    awards: ['Danh nhân văn hóa thế giới UNESCO']
  },
  {
    name: 'Tô Hoài',
    title: 'Nhà văn thiếu nhi',
    bio: 'Tô Hoài (1920-2014) là một nhà văn nổi tiếng với các tác phẩm viết cho thiếu nhi. "Dế Mèn phiêu lưu ký" là tác phẩm đưa tên tuổi ông đến với độc giả cả nước và đã được dịch ra nhiều thứ tiếng.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    awards: ['Giải thưởng Hồ Chí Minh về Văn học Nghệ thuật', 'Giải thưởng Hội Nhà văn Việt Nam']
  },
  {
    name: 'Nguyễn Ngọc Tư',
    title: 'Nhà văn đương đại',
    bio: 'Nguyễn Ngọc Tư (sinh 1976) là một nhà văn Việt Nam đương đại nổi tiếng với giọng văn mộc mạc, đậm chất Nam Bộ. Tác phẩm tiêu biểu: "Cánh đồng bất tận", "Biển người mênh mông".',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    awards: ['Giải thưởng Hội Nhà văn Việt Nam 2006']
  },
  {
    name: 'Nguyễn Phong Việt',
    title: 'Nhà thơ trẻ',
    bio: 'Nguyễn Phong Việt là nhà thơ trẻ nổi tiếng với những bài thơ về tình yêu và cuộc sống. Thơ của anh được nhiều bạn trẻ yêu thích vì sự chân thành và dễ đồng cảm.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    awards: []
  },
  {
    name: 'Anh Khang',
    title: 'Tác giả sách tâm lý',
    bio: 'Anh Khang là tác giả trẻ nổi tiếng với các cuốn sách về tâm lý, kỹ năng sống dành cho giới trẻ. Tác phẩm "Đi qua thương nhớ" từng là sách bán chạy.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    awards: []
  },
  {
    name: 'Tony Buổi Sáng',
    title: 'Tác giả truyền cảm hứng',
    bio: 'Tony Buổi Sáng là bút danh của một tác giả nổi tiếng với loạt bài viết truyền cảm hứng trên mạng xã hội, sau đó được tập hợp thành sách.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    awards: []
  },
  {
    name: 'Rosie Nguyễn',
    title: 'Tác giả sách phát triển bản thân',
    bio: 'Rosie Nguyễn là tác giả cuốn "Tuổi trẻ đáng giá bao nhiêu" - một trong những cuốn sách bán chạy nhất dành cho giới trẻ Việt Nam.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    awards: ['Sách bán chạy 2016-2017']
  },

  // ===== TÁC GIẢ QUỐC TẾ =====
  {
    name: 'Paulo Coelho',
    title: 'Nhà văn Brazil',
    bio: 'Paulo Coelho (sinh 1947) là một nhà văn người Brazil, tác giả của cuốn sách bán chạy nhất "Nhà giả kim" (The Alchemist) với hơn 150 triệu bản in. Ông được biết đến với những tác phẩm mang tính triết học và tâm linh sâu sắc.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    social: { facebook: 'https://facebook.com/paulocoelho', twitter: 'https://twitter.com/paulocoelho' },
    awards: ['Giải Crystal Award', 'Huân chương Légion d\'honneur của Pháp']
  },
  {
    name: 'Haruki Murakami',
    title: 'Nhà văn Nhật Bản',
    bio: 'Haruki Murakami (sinh 1949) là một trong những nhà văn đương đại nổi tiếng nhất của Nhật Bản. Tác phẩm của ông mang phong cách siêu thực và huyền bí, được dịch ra hơn 50 ngôn ngữ. Tác phẩm tiêu biểu: "Rừng Na-uy", "Kafka bên bờ biển".',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400',
    awards: ['Giải Franz Kafka', 'Giải Jerusalem']
  },
  {
    name: 'J.K. Rowling',
    title: 'Tác giả Harry Potter',
    bio: 'J.K. Rowling (sinh 1965) là tác giả người Anh của bộ truyện "Harry Potter" - một trong những series sách bán chạy nhất mọi thời đại với hơn 500 triệu bản in. Bộ truyện đã được chuyển thể thành loạt phim thành công vang dội.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    social: { twitter: 'https://twitter.com/jk_rowling' },
    awards: ['Giải Hugo', 'Giải Locus', 'Huân chương OBE']
  },
  {
    name: 'Stephen King',
    title: 'Bậc thầy kinh dị',
    bio: 'Stephen King (sinh 1947) là nhà văn kinh dị và giả tưởng nổi tiếng nhất thế giới. Ông đã xuất bản hơn 60 tiểu thuyết, nhiều tác phẩm được chuyển thể thành phim như "The Shining", "It", "The Green Mile".',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    social: { twitter: 'https://twitter.com/stephenking' },
    awards: ['Giải Bram Stoker', 'Giải World Fantasy', 'Huân chương Nghệ thuật Quốc gia Mỹ']
  },
  {
    name: 'Agatha Christie',
    title: 'Nữ hoàng trinh thám',
    bio: 'Agatha Christie (1890-1976) là nữ tác giả người Anh được mệnh danh là "Nữ hoàng truyện trinh thám". Bà đã viết 66 tiểu thuyết trinh thám và 14 tập truyện ngắn, với các nhân vật nổi tiếng như Hercule Poirot và Miss Marple.',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    awards: ['Dame Commander of the Order of the British Empire']
  },
  {
    name: 'Dan Brown',
    title: 'Nhà văn trinh thám Mỹ',
    bio: 'Dan Brown (sinh 1964) là tác giả của nhiều tiểu thuyết trinh thám bán chạy như "Mật mã Da Vinci", "Thiên thần và Ác quỷ", "Hỏa ngục". Sách của ông kết hợp giữa lịch sử, tôn giáo và khoa học.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    awards: []
  },
  {
    name: 'Dale Carnegie',
    title: 'Tác giả sách kỹ năng sống',
    bio: 'Dale Carnegie (1888-1955) là tác giả người Mỹ nổi tiếng với các cuốn sách về kỹ năng giao tiếp và phát triển bản thân. "Đắc nhân tâm" (How to Win Friends and Influence People) là một trong những cuốn sách bán chạy nhất mọi thời đại.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    awards: []
  },
  {
    name: 'Robert Kiyosaki',
    title: 'Tác giả tài chính cá nhân',
    bio: 'Robert Kiyosaki (sinh 1947) là doanh nhân và tác giả người Mỹ, nổi tiếng với cuốn "Cha giàu cha nghèo" (Rich Dad Poor Dad) - một trong những cuốn sách tài chính cá nhân bán chạy nhất.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    awards: []
  },
  {
    name: 'Napoleon Hill',
    title: 'Tác giả sách thành công',
    bio: 'Napoleon Hill (1883-1970) là tác giả người Mỹ, nổi tiếng với cuốn "Think and Grow Rich" (Suy nghĩ và làm giàu) - một trong những cuốn sách self-help bán chạy nhất mọi thời đại.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    awards: []
  },
  {
    name: 'Keigo Higashino',
    title: 'Nhà văn trinh thám Nhật Bản',
    bio: 'Keigo Higashino (sinh 1958) là một trong những tác giả trinh thám nổi tiếng nhất Nhật Bản. Tác phẩm tiêu biểu: "Phía sau nghi can X", "Bí mật của Naoko", "Giả dối lấp lánh".',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    awards: ['Giải Naoki', 'Giải Mystery Writers of Japan']
  },
  {
    name: 'Kim Dung',
    title: 'Bậc thầy kiếm hiệp',
    bio: 'Kim Dung (1924-2018), tên thật là Tra Lương Dung, là nhà văn Hồng Kông nổi tiếng với các tiểu thuyết kiếm hiệp. Các tác phẩm như "Tiếu ngạo giang hồ", "Thiên long bát bộ", "Anh hùng xạ điêu" đã trở thành kinh điển.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    awards: ['Giải Grand Bauhinia Medal']
  },
  {
    name: 'Thích Nhất Hạnh',
    title: 'Thiền sư, nhà văn',
    bio: 'Thích Nhất Hạnh (1926-2022) là thiền sư, nhà văn, nhà thơ Việt Nam. Ông là người sáng lập truyền thống Làng Mai và được biết đến trên toàn thế giới với các tác phẩm về thiền định và chánh niệm.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    awards: ['Được Martin Luther King Jr. đề cử Nobel Hòa bình']
  },
  {
    name: 'Yuval Noah Harari',
    title: 'Sử gia, triết gia',
    bio: 'Yuval Noah Harari (sinh 1976) là giáo sư sử học người Israel, nổi tiếng với các cuốn sách "Sapiens: Lược sử loài người", "Homo Deus" và "21 bài học cho thế kỷ 21".',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    awards: []
  },
  {
    name: 'Osho',
    title: 'Triết gia tâm linh',
    bio: 'Osho (1931-1990), tên thật là Bhagwan Shree Rajneesh, là một nhà tư tưởng tâm linh Ấn Độ. Các bài giảng của ông về thiền định và tâm linh đã được xuất bản thành hàng trăm cuốn sách.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    awards: []
  }
];

async function seedAuthors() {
  try {
    console.log('🔄 Đang kết nối database...');
    await connectDB();
    
    console.log('📚 Đang seed dữ liệu authors...');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const authorData of sampleAuthors) {
      // Check if author already exists
      const existing = await Author.findOne({ name: authorData.name });
      
      if (existing) {
        // Update existing author with new data (except name)
        if (!existing.bio || existing.bio.length < authorData.bio?.length) {
          await Author.updateOne(
            { _id: existing._id },
            { 
              $set: { 
                bio: authorData.bio,
                title: authorData.title,
                avatar: authorData.avatar || existing.avatar,
                social: authorData.social || existing.social,
                awards: authorData.awards?.length > 0 ? authorData.awards : existing.awards
              }
            }
          );
          console.log(`🔄 Đã cập nhật: ${authorData.name}`);
          updated++;
        } else {
          console.log(`⏭️  Đã tồn tại: ${authorData.name}`);
          skipped++;
        }
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
        // Determine if Vietnamese author
        const isVietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(authorName);
        
        const author = new Author({
          name: authorName,
          title: isVietnamese ? 'Tác giả Việt Nam' : 'Tác giả',
          bio: `${authorName} là tác giả có sách trong hệ thống Bookle.`
        });
        await author.save();
        console.log(`✅ Đã tạo từ product: ${authorName}`);
        created++;
      }
    }
    
    // Count books for each author
    console.log('\n📊 Thống kê số sách của mỗi tác giả...');
    const allAuthors = await Author.find({});
    const authorsWithBooks = [];
    
    for (const author of allAuthors) {
      const bookCount = await Product.countDocuments({ 
        author: { $regex: author.name, $options: 'i' },
        isAvailable: true 
      });
      if (bookCount > 0) {
        authorsWithBooks.push({ name: author.name, count: bookCount });
      }
    }
    
    // Sort by book count and show top 10
    authorsWithBooks.sort((a, b) => b.count - a.count);
    console.log('\nTop 10 tác giả có nhiều sách nhất:');
    authorsWithBooks.slice(0, 10).forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.name}: ${a.count} cuốn`);
    });
    
    console.log('\n✨ Hoàn thành!');
    console.log(`   ✅ Đã tạo mới: ${created} authors`);
    console.log(`   🔄 Đã cập nhật: ${updated} authors`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} authors`);
    console.log(`   📚 Tổng số authors: ${await Author.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi seed authors:', error);
    process.exit(1);
  }
}

seedAuthors();
