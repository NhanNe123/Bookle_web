"use strict";

import dotenv from 'dotenv';
dotenv.config();
import Product from '../models/Product.js';
import { connectDB, disconnectDB } from '../db/index.js';

// Helper to generate slug
const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Random number between min and max
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Random item from array
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Random items from array (multiple)
const randomMultiple = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Book cover images (placeholder URLs)
const bookImages = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1509266272358-7701da638078?w=400&h=600&fit=crop',
];

// Authors by category
const authors = {
  'van-hoc': [
    'Nguyễn Nhật Ánh', 'Nguyễn Ngọc Tư', 'Nguyễn Huy Thiệp', 'Lê Minh Khuê', 
    'Tô Hoài', 'Nam Cao', 'Ngô Tất Tố', 'Vũ Trọng Phụng', 'Xuân Diệu',
    'Haruki Murakami', 'Paulo Coelho', 'Gabriel García Márquez', 'Ernest Hemingway',
    'Fyodor Dostoevsky', 'Leo Tolstoy', 'Jane Austen', 'Charlotte Brontë',
    'Victor Hugo', 'Alexandre Dumas', 'Oscar Wilde', 'Franz Kafka'
  ],
  'kinh-te': [
    'Robert Kiyosaki', 'Napoleon Hill', 'Warren Buffett', 'Peter Lynch',
    'Benjamin Graham', 'Philip Fisher', 'John C. Bogle', 'Ray Dalio',
    'Tony Robbins', 'Shark Hưng', 'Đặng Lê Nguyên Vũ', 'Trần Bảo Minh'
  ],
  'khoa-hoc': [
    'Stephen Hawking', 'Richard Feynman', 'Carl Sagan', 'Neil deGrasse Tyson',
    'Yuval Noah Harari', 'Michio Kaku', 'Brian Greene', 'Bill Bryson',
    'Nguyễn Văn Tuấn', 'Ngô Bảo Châu'
  ],
  'lich-su': [
    'Yuval Noah Harari', 'Jared Diamond', 'Will Durant', 'Howard Zinn',
    'Phan Huy Lê', 'Trần Trọng Kim', 'Nguyễn Khắc Viện', 'Lê Văn Hưu',
    'David McCullough', 'Doris Kearns Goodwin'
  ],
  'tam-ly': [
    'Dale Carnegie', 'Stephen Covey', 'Daniel Goleman', 'Malcolm Gladwell',
    'Carol Dweck', 'Angela Duckworth', 'Brené Brown', 'Simon Sinek',
    'Eckhart Tolle', 'Thích Nhất Hạnh', 'Đức Đạt Lai Lạt Ma'
  ],
  'thieu-nhi': [
    'Nguyễn Nhật Ánh', 'Tô Hoài', 'J.K. Rowling', 'Roald Dahl',
    'Dr. Seuss', 'Eric Carle', 'Maurice Sendak', 'Astrid Lindgren'
  ],
  'cong-nghe': [
    'Walter Isaacson', 'Elon Musk', 'Jeff Bezos', 'Satya Nadella',
    'Eric Schmidt', 'Reid Hoffman', 'Andrew Ng', 'Geoffrey Hinton'
  ]
};

// Publishers
const publishers = [
  'NXB Trẻ', 'NXB Kim Đồng', 'NXB Văn Học', 'NXB Tổng Hợp TP.HCM',
  'NXB Hội Nhà Văn', 'NXB Lao Động', 'NXB Thế Giới', 'NXB Dân Trí',
  'Alpha Books', 'First News', 'Nhã Nam', 'Đinh Tị Books', 'Skybooks'
];

// Comprehensive book data by category
const booksByCategory = {
  // VĂN HỌC - NGHỆ THUẬT
  'tieu-thuyet': [
    { name: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', author: 'Nguyễn Nhật Ánh', desc: 'Câu chuyện tuổi thơ đầy cảm xúc tại vùng quê nghèo' },
    { name: 'Mắt Biếc', author: 'Nguyễn Nhật Ánh', desc: 'Tình yêu đơn phương đau đáu của Ngạn dành cho Hà Lan' },
    { name: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', author: 'Nguyễn Nhật Ánh', desc: 'Hành trình quay về tuổi thơ hồn nhiên' },
    { name: 'Cô Gái Đến Từ Hôm Qua', author: 'Nguyễn Nhật Ánh', desc: 'Câu chuyện tình yêu học trò ngọt ngào' },
    { name: 'Rừng Na Uy', author: 'Haruki Murakami', desc: 'Tiểu thuyết trưởng thành với giọng kể trữ tình sâu sắc' },
    { name: 'Kafka Bên Bờ Biển', author: 'Haruki Murakami', desc: 'Hành trình tìm kiếm bản thân của cậu bé 15 tuổi' },
    { name: '1Q84', author: 'Haruki Murakami', desc: 'Thế giới song song đầy bí ẩn và tình yêu' },
    { name: 'Biên Niên Ký Chim Vặn Dây Cót', author: 'Haruki Murakami', desc: 'Cuộc phiêu lưu siêu thực tìm kiếm vợ' },
    { name: 'Nhà Giả Kim', author: 'Paulo Coelho', desc: 'Hành trình theo đuổi giấc mơ của Santiago' },
    { name: 'Trăm Năm Cô Đơn', author: 'Gabriel García Márquez', desc: 'Gia đình Buendía qua bảy thế hệ' },
    { name: 'Tình Yêu Thời Thổ Tả', author: 'Gabriel García Márquez', desc: 'Tình yêu kéo dài hơn nửa thế kỷ' },
    { name: 'Ông Già Và Biển Cả', author: 'Ernest Hemingway', desc: 'Cuộc chiến giữa ông già và con cá kiếm khổng lồ' },
    { name: 'Tội Ác Và Hình Phạt', author: 'Fyodor Dostoevsky', desc: 'Sự giày vò lương tâm sau tội ác' },
    { name: 'Anh Em Nhà Karamazov', author: 'Fyodor Dostoevsky', desc: 'Bi kịch gia đình và triết học sâu sắc' },
    { name: 'Chiến Tranh Và Hòa Bình', author: 'Leo Tolstoy', desc: 'Bức tranh hoành tráng về nước Nga thời Napoleon' },
    { name: 'Anna Karenina', author: 'Leo Tolstoy', desc: 'Bi kịch tình yêu và xã hội quý tộc Nga' },
    { name: 'Kiêu Hãnh Và Định Kiến', author: 'Jane Austen', desc: 'Tình yêu của Elizabeth Bennet và Mr. Darcy' },
    { name: 'Jane Eyre', author: 'Charlotte Brontë', desc: 'Cuộc đời cô gái mồ côi Jane Eyre' },
    { name: 'Những Người Khốn Khổ', author: 'Victor Hugo', desc: 'Cuộc đời Jean Valjean và nước Pháp thế kỷ 19' },
    { name: 'Bá Tước Monte Cristo', author: 'Alexandre Dumas', desc: 'Câu chuyện trả thù hoàn hảo' },
  ],
  'trinh-tham': [
    { name: 'Mật Mã Da Vinci', author: 'Dan Brown', desc: 'Giải mã bí ẩn tôn giáo cùng Robert Langdon' },
    { name: 'Thiên Thần Và Ác Quỷ', author: 'Dan Brown', desc: 'Âm mưu của Illuminati tại Vatican' },
    { name: 'Biểu Tượng Thất Truyền', author: 'Dan Brown', desc: 'Bí mật Hội Tam Điểm tại Washington' },
    { name: 'Nguồn Cội', author: 'Dan Brown', desc: 'Khám phá nguồn gốc và tương lai loài người' },
    { name: 'Sherlock Holmes Toàn Tập', author: 'Arthur Conan Doyle', desc: 'Những vụ án ly kỳ của thám tử lừng danh' },
    { name: 'Án Mạng Trên Chuyến Tàu Tốc Hành', author: 'Agatha Christie', desc: 'Hercule Poirot điều tra vụ án trên tàu' },
    { name: 'Mười Người Da Đen Nhỏ', author: 'Agatha Christie', desc: 'Mười người mắc kẹt trên đảo hoang' },
    { name: 'Cô Gái Có Hình Xăm Rồng', author: 'Stieg Larsson', desc: 'Bí ẩn gia đình Vanger' },
    { name: 'Im Lặng Của Bầy Cừu', author: 'Thomas Harris', desc: 'Cuộc đối đầu với Hannibal Lecter' },
    { name: 'Vụ Án ABC', author: 'Agatha Christie', desc: 'Kẻ giết người theo thứ tự bảng chữ cái' },
  ],
  'lang-man': [
    { name: 'Bên Nhau Trọn Đời', author: 'Cố Mạn', desc: 'Tình yêu đẹp của Hà Dĩ Thâm và Triệu Mặc Sênh' },
    { name: 'Yêu Em Từ Cái Nhìn Đầu Tiên', author: 'Cố Mạn', desc: 'Tình yêu online đến offline' },
    { name: 'Sam Sam Đến Rồi', author: 'Cố Mạn', desc: 'Chuyện tình của cô nhân viên và CEO' },
    { name: 'Bước Chậm Lại Giữa Thế Gian Vội Vã', author: 'Hae Min', desc: 'Sống chậm lại để yêu thương' },
    { name: 'The Notebook - Nhật Ký', author: 'Nicholas Sparks', desc: 'Tình yêu vượt thời gian' },
    { name: 'Một Litre Nước Mắt', author: 'Kitō Aya', desc: 'Câu chuyện cảm động của cô gái mắc bệnh hiếm' },
    { name: 'Call Me By Your Name', author: 'André Aciman', desc: 'Mùa hè tình yêu tại Ý' },
    { name: 'Me Before You', author: 'Jojo Moyes', desc: 'Tình yêu và những lựa chọn khó khăn' },
  ],
  'kinh-di': [
    { name: 'IT - Chú Hề Ma Quái', author: 'Stephen King', desc: 'Nỗi sợ hãi tuổi thơ tại Derry' },
    { name: 'Nghĩa Địa Thú Cưng', author: 'Stephen King', desc: 'Bí ẩn của nghĩa địa kỳ lạ' },
    { name: 'The Shining', author: 'Stephen King', desc: 'Khách sạn ma ám và sự điên loạn' },
    { name: 'Dracula', author: 'Bram Stoker', desc: 'Bá tước ma cà rồng huyền thoại' },
    { name: 'Frankenstein', author: 'Mary Shelley', desc: 'Sự sáng tạo quái vật của tiến sĩ Frankenstein' },
    { name: 'Bóng Ma Trong Nhà Hát', author: 'Gaston Leroux', desc: 'Bí ẩn dưới nhà hát Opera Paris' },
    { name: 'Tiếng Gọi Của Cthulhu', author: 'H.P. Lovecraft', desc: 'Kinh hoàng vũ trụ Lovecraft' },
    { name: 'Ngôi Nhà Hồng', author: 'Shirley Jackson', desc: 'Ngôi nhà ma ám nổi tiếng nhất' },
  ],
  'light-novel': [
    { name: 'Sword Art Online', author: 'Reki Kawahara', desc: 'Mắc kẹt trong thế giới game VRMMO' },
    { name: 'Re:Zero', author: 'Tappei Nagatsuki', desc: 'Quay ngược thời gian sau mỗi lần chết' },
    { name: 'Overlord', author: 'Kugane Maruyama', desc: 'Skeleton Lord trong thế giới game' },
    { name: 'Konosuba', author: 'Natsume Akatsuki', desc: 'Phiêu lưu hài hước ở thế giới fantasy' },
    { name: 'No Game No Life', author: 'Yū Kamiya', desc: 'Anh em thiên tài chinh phục thế giới game' },
    { name: 'Mushoku Tensei', author: 'Rifujin na Magonote', desc: 'Chuyển sinh với kiến thức kiếp trước' },
    { name: 'That Time I Got Reincarnated as a Slime', author: 'Fuse', desc: 'Chuyển sinh thành slime đầy sức mạnh' },
    { name: 'The Rising of the Shield Hero', author: 'Aneko Yusagi', desc: 'Anh hùng khiên bị phản bội' },
  ],
  // KINH TẾ - KINH DOANH
  'quan-tri': [
    { name: 'Từ Tốt Đến Vĩ Đại', author: 'Jim Collins', desc: 'Bí quyết để công ty vượt trội' },
    { name: 'Khởi Nghiệp Tinh Gọn', author: 'Eric Ries', desc: 'Phương pháp startup hiệu quả' },
    { name: 'Chiến Lược Đại Dương Xanh', author: 'W. Chan Kim', desc: 'Tạo ra thị trường mới không cạnh tranh' },
    { name: 'Quản Trị Theo Phong Cách Google', author: 'Eric Schmidt', desc: 'Văn hóa và quản trị của Google' },
    { name: '7 Thói Quen Của Người Thành Đạt', author: 'Stephen Covey', desc: 'Nguyên tắc sống và làm việc hiệu quả' },
    { name: 'Lãnh Đạo 360 Độ', author: 'John C. Maxwell', desc: 'Lãnh đạo từ mọi vị trí' },
    { name: 'Nghệ Thuật Quản Lý Thời Gian', author: 'Brian Tracy', desc: 'Tối ưu hóa thời gian làm việc' },
    { name: 'Bản Đồ Chiến Lược', author: 'Robert S. Kaplan', desc: 'Balanced Scorecard trong quản trị' },
  ],
  'khoi-nghiep': [
    { name: 'Zero To One', author: 'Peter Thiel', desc: 'Xây dựng startup từ con số 0' },
    { name: 'Kẻ Thắng Cuộc Là Ai', author: 'Jack Welch', desc: 'Triết lý quản trị của CEO GE' },
    { name: 'Khởi Sự Kinh Doanh', author: 'Guy Kawasaki', desc: 'Nghệ thuật khởi nghiệp' },
    { name: 'Tư Duy Khởi Nghiệp', author: 'Reid Hoffman', desc: 'Tư duy của người sáng lập LinkedIn' },
    { name: 'Sức Mạnh Của Kẻ Ngoài Cuộc', author: 'Malcolm Gladwell', desc: 'Lợi thế của người ngoài lề' },
    { name: 'Vào Việc Ngay', author: 'Jason Fried', desc: 'Triết lý làm việc của Basecamp' },
    { name: 'Công Ty Khởi Nghiệp 100$', author: 'Chris Guillebeau', desc: 'Khởi nghiệp với vốn ít' },
    { name: 'Startup Nation', author: 'Dan Senor', desc: 'Bí mật khởi nghiệp của Israel' },
  ],
  'dau-tu-tai-chinh': [
    { name: 'Cha Giàu Cha Nghèo', author: 'Robert Kiyosaki', desc: 'Triết lý tài chính cá nhân' },
    { name: 'Nhà Đầu Tư Thông Minh', author: 'Benjamin Graham', desc: 'Kinh thánh đầu tư giá trị' },
    { name: 'Tư Duy Nhanh Và Chậm', author: 'Daniel Kahneman', desc: 'Tâm lý học hành vi và đầu tư' },
    { name: 'Đầu Tư Cổ Phiếu', author: 'Peter Lynch', desc: 'Chiến lược của nhà quản lý quỹ huyền thoại' },
    { name: 'Nguyên Lý Ray Dalio', author: 'Ray Dalio', desc: 'Nguyên tắc sống và đầu tư' },
    { name: 'Người Giàu Nhất Thành Babylon', author: 'George S. Clason', desc: 'Bài học tài chính từ Babylon cổ đại' },
    { name: 'Dạy Con Làm Giàu', author: 'Robert Kiyosaki', desc: 'Giáo dục tài chính cho trẻ' },
    { name: 'Tiền Đẻ Ra Tiền', author: 'Bodo Schäfer', desc: 'Bí quyết quản lý tiền thông minh' },
  ],
  'marketing': [
    { name: 'Marketing 4.0', author: 'Philip Kotler', desc: 'Marketing trong thời đại số' },
    { name: 'Nghệ Thuật Marketing', author: 'Seth Godin', desc: 'Tạo nên sự khác biệt' },
    { name: 'Bán Hàng Bằng Tâm', author: 'Zig Ziglar', desc: 'Nghệ thuật bán hàng chân thành' },
    { name: 'Định Vị Thương Hiệu', author: 'Al Ries', desc: 'Chiến lược định vị trong tâm trí khách hàng' },
    { name: 'Chiến Tranh Marketing', author: 'Al Ries', desc: 'Chiến lược cạnh tranh thị trường' },
    { name: 'Contagious - Tạo Đà Lan Truyền', author: 'Jonah Berger', desc: 'Tại sao một số thứ lan truyền' },
    { name: 'Made To Stick', author: 'Chip Heath', desc: 'Ý tưởng nào đọng lại trong tâm trí' },
    { name: 'Influence - Sức Mạnh Thuyết Phục', author: 'Robert Cialdini', desc: 'Tâm lý học thuyết phục' },
  ],
  // KHOA HỌC - CÔNG NGHỆ
  'khoa-hoc-tu-nhien': [
    { name: 'Lược Sử Thời Gian', author: 'Stephen Hawking', desc: 'Vũ trụ từ Big Bang đến hố đen' },
    { name: 'Cosmos', author: 'Carl Sagan', desc: 'Hành trình khám phá vũ trụ' },
    { name: 'Nguồn Gốc Các Loài', author: 'Charles Darwin', desc: 'Lý thuyết tiến hóa' },
    { name: 'Vũ Trụ Trong Vỏ Hạt Dẻ', author: 'Stephen Hawking', desc: 'Bí ẩn không gian và thời gian' },
    { name: 'Vật Lý Vui', author: 'Richard Feynman', desc: 'Vật lý qua góc nhìn vui nhộn' },
    { name: 'Lịch Sử Ngắn Gọn Của Vạn Vật', author: 'Bill Bryson', desc: 'Từ Big Bang đến thời hiện đại' },
    { name: 'Vũ Trụ Thanh Nhã', author: 'Brian Greene', desc: 'Lý thuyết dây và vũ trụ' },
    { name: 'Astrophysics For People In A Hurry', author: 'Neil deGrasse Tyson', desc: 'Vật lý thiên văn dễ hiểu' },
  ],
  'cong-nghe-thong-tin': [
    { name: 'Clean Code', author: 'Robert C. Martin', desc: 'Nghệ thuật viết code sạch' },
    { name: 'The Pragmatic Programmer', author: 'David Thomas', desc: 'Triết lý lập trình thực dụng' },
    { name: 'Design Patterns', author: 'Gang of Four', desc: 'Mẫu thiết kế phần mềm' },
    { name: 'Code Complete', author: 'Steve McConnell', desc: 'Xây dựng phần mềm hoàn chỉnh' },
    { name: 'Cracking The Coding Interview', author: 'Gayle McDowell', desc: 'Chuẩn bị phỏng vấn lập trình' },
    { name: 'Introduction To Algorithms', author: 'Thomas H. Cormen', desc: 'Giáo trình thuật toán kinh điển' },
    { name: 'Head First Design Patterns', author: 'Eric Freeman', desc: 'Design patterns dễ hiểu' },
    { name: 'Refactoring', author: 'Martin Fowler', desc: 'Cải thiện code hiện có' },
  ],
  'ai-machine-learning': [
    { name: 'Deep Learning', author: 'Ian Goodfellow', desc: 'Sách giáo khoa Deep Learning' },
    { name: 'Hands-On Machine Learning', author: 'Aurélien Géron', desc: 'ML với Scikit-Learn và TensorFlow' },
    { name: 'Pattern Recognition', author: 'Christopher Bishop', desc: 'Nhận dạng mẫu và Machine Learning' },
    { name: 'AI Superpowers', author: 'Kai-Fu Lee', desc: 'Trung Quốc, Silicon Valley và AI' },
    { name: 'Life 3.0', author: 'Max Tegmark', desc: 'Tương lai của AI' },
    { name: 'The Master Algorithm', author: 'Pedro Domingos', desc: 'Thuật toán thay đổi thế giới' },
    { name: 'Human Compatible', author: 'Stuart Russell', desc: 'AI an toàn cho loài người' },
    { name: 'Superintelligence', author: 'Nick Bostrom', desc: 'Nguy cơ từ siêu trí tuệ' },
  ],
  // LỊCH SỬ - CHÍNH TRỊ - XÃ HỘI
  'lich-su-the-gioi': [
    { name: 'Sapiens - Lược Sử Loài Người', author: 'Yuval Noah Harari', desc: 'Lịch sử loài người từ thời tiền sử' },
    { name: 'Homo Deus', author: 'Yuval Noah Harari', desc: 'Tương lai của loài người' },
    { name: '21 Bài Học Cho Thế Kỷ 21', author: 'Yuval Noah Harari', desc: 'Thách thức của thế kỷ 21' },
    { name: 'Súng, Vi Trùng Và Thép', author: 'Jared Diamond', desc: 'Tại sao văn minh phương Tây thống trị' },
    { name: 'Sụp Đổ', author: 'Jared Diamond', desc: 'Các nền văn minh sụp đổ như thế nào' },
    { name: 'Thế Giới Phẳng', author: 'Thomas Friedman', desc: 'Toàn cầu hóa thế kỷ 21' },
    { name: 'Câu Chuyện Triết Học', author: 'Will Durant', desc: 'Lịch sử triết học phương Tây' },
    { name: '1984', author: 'George Orwell', desc: 'Xã hội độc tài trong tương lai' },
  ],
  'lich-su-viet-nam': [
    { name: 'Đại Việt Sử Ký Toàn Thư', author: 'Ngô Sĩ Liên', desc: 'Bộ sử Việt Nam từ thời Hùng Vương' },
    { name: 'Việt Nam Sử Lược', author: 'Trần Trọng Kim', desc: 'Lịch sử Việt Nam tổng quan' },
    { name: 'Lịch Sử Việt Nam', author: 'Phan Huy Lê', desc: 'Nghiên cứu lịch sử Việt Nam' },
    { name: 'Ngàn Năm Áo Mũ', author: 'Trần Quang Đức', desc: 'Trang phục Việt Nam qua các triều đại' },
    { name: 'Người Việt Gốc Miên', author: 'Nguyễn Văn Hầu', desc: 'Văn hóa người Khmer Nam Bộ' },
    { name: 'Đinh Tiên Hoàng - Người Sáng Lập Nhà Đinh', author: 'Nguyễn Khắc Thuần', desc: 'Tiểu sử Đinh Bộ Lĩnh' },
    { name: 'Lịch Sử Họ Nguyễn', author: 'Nhiều tác giả', desc: 'Nguồn gốc và phát triển họ Nguyễn' },
    { name: 'Vua Cha Việt Nam', author: 'Nguyễn Khắc Thuần', desc: 'Các vị vua Việt Nam' },
  ],
  // TÂM LÝ - KỸ NĂNG SỐNG
  'tam-ly-hoc': [
    { name: 'Đắc Nhân Tâm', author: 'Dale Carnegie', desc: 'Nghệ thuật thu phục lòng người' },
    { name: 'Quẳng Gánh Lo Đi Và Vui Sống', author: 'Dale Carnegie', desc: 'Cách sống không lo âu' },
    { name: 'Trí Tuệ Xúc Cảm', author: 'Daniel Goleman', desc: 'EQ quan trọng hơn IQ' },
    { name: 'Outliers - Những Kẻ Xuất Chúng', author: 'Malcolm Gladwell', desc: 'Bí mật của thành công' },
    { name: 'Quy Luật 10.000 Giờ', author: 'Malcolm Gladwell', desc: 'Thời gian cần để trở thành chuyên gia' },
    { name: 'Tư Duy Nhanh Và Chậm', author: 'Daniel Kahneman', desc: 'Hai hệ thống tư duy của não' },
    { name: 'Grit - Sức Mạnh Đam Mê', author: 'Angela Duckworth', desc: 'Kiên trì quan trọng hơn tài năng' },
    { name: 'Mindset - Tâm Lý Học Thành Công', author: 'Carol Dweck', desc: 'Tư duy cố định vs tư duy phát triển' },
  ],
  'phat-trien-ban-than': [
    { name: 'Atomic Habits - Thay Đổi Tí Hon', author: 'James Clear', desc: 'Xây dựng thói quen nhỏ tạo kết quả lớn' },
    { name: 'Sức Mạnh Của Thói Quen', author: 'Charles Duhigg', desc: 'Khoa học về thói quen' },
    { name: 'Không Bao Giờ Là Thất Bại', author: 'John Maxwell', desc: 'Học từ thất bại' },
    { name: 'Eat That Frog - Ăn Con Ếch', author: 'Brian Tracy', desc: 'Làm việc quan trọng nhất trước' },
    { name: 'Deep Work - Làm Ra Làm', author: 'Cal Newport', desc: 'Tập trung sâu trong thời đại xao nhãng' },
    { name: 'Essentialism - Chủ Nghĩa Tối Giản', author: 'Greg McKeown', desc: 'Làm ít nhưng tốt hơn' },
    { name: 'Sức Mạnh Của Sự Tĩnh Lặng', author: 'Eckhart Tolle', desc: 'Sống trong hiện tại' },
    { name: 'Dám Nghĩ Lớn', author: 'David Schwartz', desc: 'Tư duy lớn, thành công lớn' },
  ],
  'thien-song-toi-gian': [
    { name: 'Nghệ Thuật Của Sự Tĩnh Lặng', author: 'Thích Nhất Hạnh', desc: 'Thiền định và chánh niệm' },
    { name: 'Phép Màu Của Sự Dọn Dẹp', author: 'Marie Kondo', desc: 'Phương pháp KonMari' },
    { name: 'Sống Tối Giản', author: 'Fumio Sasaki', desc: 'Cuộc sống với ít đồ vật hơn' },
    { name: 'Wabi-Sabi - Vẻ Đẹp Bất Toàn', author: 'Beth Kempton', desc: 'Triết lý sống của Nhật Bản' },
    { name: 'Ikigai - Bí Quyết Sống Lâu', author: 'Héctor García', desc: 'Mục đích sống của người Nhật' },
    { name: 'Sức Mạnh Của Hiện Tại', author: 'Eckhart Tolle', desc: 'Sống trong khoảnh khắc' },
    { name: 'Thiền Cho Người Bận Rộn', author: 'Đức Đạt Lai Lạt Ma', desc: 'Thiền định hàng ngày' },
    { name: 'Tâm An Lành', author: 'Thích Nhất Hạnh', desc: 'Bình an trong cuộc sống' },
  ],
  // THIẾU NHI - GIÁO DỤC
  'truyen-tranh': [
    { name: 'Doraemon Tập 1', author: 'Fujiko F. Fujio', desc: 'Chú mèo máy đến từ tương lai' },
    { name: 'Conan Tập 1', author: 'Aoyama Gosho', desc: 'Thám tử lừng danh Conan' },
    { name: 'One Piece Tập 1', author: 'Eiichiro Oda', desc: 'Hành trình tìm kho báu One Piece' },
    { name: 'Naruto Tập 1', author: 'Masashi Kishimoto', desc: 'Chàng ninja làng Lá' },
    { name: 'Dragon Ball Tập 1', author: 'Akira Toriyama', desc: 'Hành trình tìm ngọc rồng' },
    { name: 'Shin - Cậu Bé Bút Chì Tập 1', author: 'Yoshito Usui', desc: 'Cậu bé nghịch ngợm Shin' },
    { name: 'Slam Dunk Tập 1', author: 'Takehiko Inoue', desc: 'Bóng rổ và tuổi thanh xuân' },
    { name: 'Attack on Titan Tập 1', author: 'Hajime Isayama', desc: 'Cuộc chiến với người khổng lồ' },
  ],
  'sach-hoc-tieng-anh': [
    { name: 'English Grammar In Use', author: 'Raymond Murphy', desc: 'Ngữ pháp tiếng Anh cơ bản' },
    { name: 'Oxford Word Skills', author: 'Ruth Gairns', desc: 'Từ vựng tiếng Anh theo chủ đề' },
    { name: 'IELTS Cambridge 18', author: 'Cambridge', desc: 'Đề thi IELTS thực tế' },
    { name: 'Destination B2', author: 'Malcolm Mann', desc: 'Ngữ pháp và từ vựng trung cấp' },
    { name: 'English Vocabulary In Use', author: 'Michael McCarthy', desc: 'Từ vựng tiếng Anh nâng cao' },
    { name: 'TOEIC Test Preparation', author: 'ETS', desc: 'Luyện thi TOEIC' },
    { name: 'Pronunciation In Use', author: 'Mark Hancock', desc: 'Phát âm tiếng Anh' },
    { name: 'Collocations In Use', author: 'Michael McCarthy', desc: 'Cụm từ cố định tiếng Anh' },
  ],
  'giao-trinh': [
    { name: 'Giáo Trình Toán Cao Cấp', author: 'Nguyễn Đình Trí', desc: 'Toán đại học cơ bản' },
    { name: 'Giáo Trình Vật Lý Đại Cương', author: 'Lương Duyên Bình', desc: 'Vật lý đại học' },
    { name: 'Giáo Trình Hóa Học Đại Cương', author: 'Nguyễn Văn Nội', desc: 'Hóa học cơ bản đại học' },
    { name: 'Giáo Trình Kinh Tế Vĩ Mô', author: 'Đinh Văn Ân', desc: 'Kinh tế vĩ mô cơ bản' },
    { name: 'Giáo Trình Triết Học Mác - Lênin', author: 'Bộ GD&ĐT', desc: 'Triết học đại cương' },
    { name: 'Giáo Trình Kế Toán Tài Chính', author: 'Võ Văn Nhị', desc: 'Kế toán doanh nghiệp' },
    { name: 'Giáo Trình Marketing Căn Bản', author: 'Trần Minh Đạo', desc: 'Marketing cơ bản' },
    { name: 'Giáo Trình Pháp Luật Đại Cương', author: 'Lê Minh Toàn', desc: 'Pháp luật cơ bản' },
  ],
};

// Generate books data
function generateBooks() {
  const allBooks = [];
  let bookId = 1;

  for (const [category, books] of Object.entries(booksByCategory)) {
    for (const book of books) {
      // Determine language based on author
      let language = 'vi';
      if (['Haruki Murakami', 'Reki Kawahara', 'Tappei Nagatsuki', 'Kugane Maruyama', 'Fuse'].includes(book.author)) {
        language = 'ja';
      } else if (['J.K. Rowling', 'Dan Brown', 'Agatha Christie', 'Stephen King', 'Arthur Conan Doyle', 'Jane Austen', 'Charlotte Brontë'].includes(book.author)) {
        language = 'en';
      } else if (['Victor Hugo', 'Alexandre Dumas', 'Gaston Leroux'].includes(book.author)) {
        language = 'fr';
      } else if (['Leo Tolstoy', 'Fyodor Dostoevsky'].includes(book.author)) {
        language = 'ru';
      } else if (['Gabriel García Márquez', 'Paulo Coelho'].includes(book.author)) {
        language = 'es';
      }

      // Generate price
      const basePrice = randomBetween(50000, 300000);
      const price = Math.round(basePrice / 1000) * 1000;
      const hasDiscount = Math.random() > 0.5;
      const compareAtPrice = hasDiscount ? Math.round((price * (1 + randomBetween(10, 30) / 100)) / 1000) * 1000 : null;

      // Generate related categories
      const relatedCategories = [category];
      
      // Add related categories based on main category
      if (['tieu-thuyet', 'trinh-tham', 'lang-man', 'kinh-di'].includes(category)) {
        if (Math.random() > 0.5) relatedCategories.push('van-hoc-nuoc-ngoai');
      }
      if (['quan-tri', 'khoi-nghiep', 'dau-tu-tai-chinh', 'marketing'].includes(category)) {
        if (Math.random() > 0.5) relatedCategories.push('kinh-te-hoc');
      }

      // Generate genres
      const genreOptions = {
        'tieu-thuyet': ['văn học', 'tiểu thuyết', 'đời sống', 'tâm lý'],
        'trinh-tham': ['trinh thám', 'bí ẩn', 'hành động', 'kịch tính'],
        'lang-man': ['lãng mạn', 'tình cảm', 'drama', 'ngôn tình'],
        'kinh-di': ['kinh dị', 'bí ẩn', 'siêu nhiên', 'rùng rợn'],
        'light-novel': ['fantasy', 'phiêu lưu', 'isekai', 'action'],
        'quan-tri': ['quản trị', 'lãnh đạo', 'kinh doanh'],
        'khoi-nghiep': ['khởi nghiệp', 'startup', 'đổi mới'],
        'dau-tu-tai-chinh': ['đầu tư', 'tài chính', 'chứng khoán'],
        'marketing': ['marketing', 'bán hàng', 'thương hiệu'],
        'khoa-hoc-tu-nhien': ['khoa học', 'vũ trụ', 'vật lý'],
        'cong-nghe-thong-tin': ['lập trình', 'công nghệ', 'phần mềm'],
        'ai-machine-learning': ['AI', 'machine learning', 'trí tuệ nhân tạo'],
        'lich-su-the-gioi': ['lịch sử', 'thế giới', 'văn minh'],
        'lich-su-viet-nam': ['lịch sử Việt Nam', 'văn hóa', 'truyền thống'],
        'tam-ly-hoc': ['tâm lý', 'phát triển', 'hành vi'],
        'phat-trien-ban-than': ['self-help', 'kỹ năng', 'thành công'],
        'thien-song-toi-gian': ['thiền', 'tối giản', 'mindfulness'],
        'truyen-tranh': ['manga', 'anime', 'truyện tranh'],
        'sach-hoc-tieng-anh': ['tiếng Anh', 'ngữ pháp', 'từ vựng'],
        'giao-trinh': ['giáo dục', 'đại học', 'học thuật'],
      };

      const genres = genreOptions[category] || ['tổng hợp'];

      allBooks.push({
        name: book.name,
        slug: slugify(book.name) + '-' + bookId,
        author: book.author,
        price,
        compareAtPrice,
        publisher: randomFrom(publishers),
        isbn: `978${randomBetween(1000000000, 9999999999)}`,
        pages: randomBetween(150, 800),
        language,
        publishedAt: new Date(randomBetween(1990, 2024), randomBetween(0, 11), randomBetween(1, 28)),
        categories: [...new Set(relatedCategories)],
        genres: randomMultiple(genres, randomBetween(2, 3)),
        stock: randomBetween(10, 200),
        isAvailable: Math.random() > 0.1,
        isHot: Math.random() > 0.85,
        featured: Math.random() > 0.9,
        rating: Math.round((3 + Math.random() * 2) * 10) / 10,
        ratingCount: randomBetween(5, 500),
        shortDescription: book.desc,
        description: `${book.desc}. Đây là tác phẩm nổi bật của tác giả ${book.author}, được nhiều độc giả yêu thích và đánh giá cao. Cuốn sách mang đến những trải nghiệm đọc tuyệt vời với nội dung sâu sắc, lối viết cuốn hút và thông điệp ý nghĩa.`,
        images: [randomFrom(bookImages)],
      });

      bookId++;
    }
  }

  return allBooks;
}

async function seedMassiveBooks() {
  let created = 0;
  let skipped = 0;
  let updated = 0;

  const books = generateBooks();
  console.log(`\n📚 Chuẩn bị thêm ${books.length} cuốn sách...\n`);

  for (const bookData of books) {
    try {
      const existing = await Product.findOne({ name: bookData.name });
      
      if (existing) {
        // Update existing book with new data
        await Product.updateOne({ _id: existing._id }, { $set: bookData });
        updated++;
      } else {
        const product = new Product(bookData);
        await product.save();
        created++;
      }

      // Progress indicator
      const total = created + skipped + updated;
      if (total % 20 === 0) {
        process.stdout.write(`   Đã xử lý: ${total}/${books.length}\r`);
      }
    } catch (error) {
      console.error(`   ❌ Lỗi với sách "${bookData.name}":`, error.message);
      skipped++;
    }
  }

  return { created, skipped, updated, total: books.length };
}

async function main() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await connectDB();

    console.log('📚 Bắt đầu thêm dữ liệu sách...');
    const result = await seedMassiveBooks();

    console.log('\n\n✨ Hoàn thành seed dữ liệu!');
    console.log(`   ✅ Tạo mới: ${result.created} cuốn`);
    console.log(`   🔄 Cập nhật: ${result.updated} cuốn`);
    console.log(`   ⏭️  Bỏ qua: ${result.skipped} cuốn`);

    const totalBooks = await Product.countDocuments();
    const availableBooks = await Product.countDocuments({ isAvailable: true });
    const hotBooks = await Product.countDocuments({ isHot: true });
    const featuredBooks = await Product.countDocuments({ featured: true });

    console.log('\n📊 Thống kê tổng quan:');
    console.log(`   📘 Tổng số sách: ${totalBooks}`);
    console.log(`   ✅ Còn hàng: ${availableBooks}`);
    console.log(`   🔥 Sách Hot: ${hotBooks}`);
    console.log(`   ⭐ Sách nổi bật: ${featuredBooks}`);

    // Category stats
    console.log('\n📁 Số sách theo danh mục:');
    const categories = ['tieu-thuyet', 'trinh-tham', 'lang-man', 'kinh-di', 'light-novel', 
                        'quan-tri', 'khoi-nghiep', 'dau-tu-tai-chinh', 'marketing',
                        'khoa-hoc-tu-nhien', 'cong-nghe-thong-tin', 'ai-machine-learning',
                        'lich-su-the-gioi', 'lich-su-viet-nam',
                        'tam-ly-hoc', 'phat-trien-ban-than', 'thien-song-toi-gian',
                        'truyen-tranh', 'sach-hoc-tieng-anh', 'giao-trinh'];
    
    for (const cat of categories) {
      const count = await Product.countDocuments({ categories: cat });
      if (count > 0) {
        console.log(`   - ${cat}: ${count} cuốn`);
      }
    }

    // Language stats
    console.log('\n🌐 Số sách theo ngôn ngữ:');
    const languages = ['vi', 'en', 'ja', 'fr', 'ru', 'es'];
    for (const lang of languages) {
      const count = await Product.countDocuments({ language: lang });
      if (count > 0) {
        const langNames = { vi: 'Tiếng Việt', en: 'Tiếng Anh', ja: 'Tiếng Nhật', fr: 'Tiếng Pháp', ru: 'Tiếng Nga', es: 'Tiếng Tây Ban Nha' };
        console.log(`   - ${langNames[lang]}: ${count} cuốn`);
      }
    }

  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

main();
