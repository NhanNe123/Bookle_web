"use strict";

import dotenv from 'dotenv';
dotenv.config();
import Product from '../models/Product.js';
import { connectDB, disconnectDB } from '../db/index.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Sample products với categories mới theo 6 nhóm lớn
const sampleProducts = [
  // ========== VĂN HỌC – NGHỆ THUẬT ==========
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
    categories: ['tieu-thuyet'],
    genres: ['văn học thiếu nhi', 'đời sống'],
    stock: 150,
    isAvailable: true,
    featured: true,
    isHot: true,
    shortDescription: 'Câu chuyện tuổi thơ tại vùng quê nghèo Phú Yên với những ký ức trong trẻo và xúc động.',
    description: 'Cuốn tiểu thuyết nổi tiếng của Nguyễn Nhật Ánh đưa người đọc trở về tuổi thơ với những câu chuyện dung dị, cảm động về tình anh em, tình bạn và tình quê.',
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
    categories: ['trinh-tham'],
    genres: ['trinh thám', 'bí ẩn'],
    stock: 95,
    isAvailable: true,
    featured: true,
    shortDescription: 'Cuộc truy tìm bí mật tôn giáo kéo dài hàng thế kỷ cùng biểu tượng học Robert Langdon.',
    description: 'Tiểu thuyết ly kỳ của Dan Brown kết hợp những bí ẩn tôn giáo, lịch sử nghệ thuật và hành trình giải mã những mật mã cổ xưa.',
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
    categories: ['lang-man'],
    genres: ['văn học Nhật Bản', 'tâm lý'],
    stock: 80,
    isAvailable: true,
    shortDescription: 'Tiểu thuyết trưởng thành nổi tiếng với giọng kể trữ tình và sâu sắc.',
    description: 'Haruki Murakami dẫn dắt người đọc qua câu chuyện tình yêu và mất mát của Toru Watanabe, phản ánh thế hệ trẻ Nhật Bản trong những năm 1960.',
  },
  {
    name: 'It',
    author: 'Stephen King',
    price: 185000,
    compareAtPrice: 220000,
    publisher: 'NXB Văn Học',
    isbn: '9780670813025',
    pages: 1138,
    language: 'vi',
    publishedAt: new Date('1986-09-15'),
    categories: ['kinh-di'],
    genres: ['kinh dị', 'siêu nhiên'],
    stock: 65,
    isAvailable: true,
    shortDescription: 'Câu chuyện kinh dị về một con quỷ ám ảnh thị trấn Derry.',
    description: 'Tác phẩm kinh dị kinh điển của Stephen King về nhóm bạn thời thơ ấu phải đối mặt với nỗi sợ hãi và quái vật trong thị trấn quê nhà.',
  },
  {
    name: 'Tuyển Tập Thơ Xuân Diệu',
    author: 'Xuân Diệu',
    price: 88000,
    compareAtPrice: 110000,
    publisher: 'NXB Văn Học',
    isbn: '9786042085012',
    pages: 320,
    language: 'vi',
    publishedAt: new Date('1940-01-01'),
    categories: ['tho'],
    genres: ['thơ', 'văn học Việt Nam'],
    stock: 45,
    isAvailable: true,
    shortDescription: 'Tuyển tập những bài thơ hay nhất của nhà thơ Xuân Diệu.',
    description: 'Tuyển tập các tác phẩm thơ nổi tiếng của Xuân Diệu, một trong những nhà thơ lớn của phong trào Thơ Mới Việt Nam.',
  },
  {
    name: 'Sword Art Online - Tập 1',
    author: 'Reki Kawahara',
    price: 75000,
    compareAtPrice: 95000,
    publisher: 'NXB Kim Đồng',
    isbn: '9784048672608',
    pages: 256,
    language: 'vi',
    publishedAt: new Date('2009-04-10'),
    categories: ['light-novel'],
    genres: ['light novel', 'fantasy', 'game'],
    stock: 120,
    isAvailable: true,
    shortDescription: 'Light novel nổi tiếng về thế giới game thực tế ảo.',
    description: 'Câu chuyện về Kirito và các game thủ bị mắc kẹt trong game VRMMORPG Sword Art Online, nơi cái chết trong game cũng là cái chết thật.',
  },
  {
    name: '1984',
    author: 'George Orwell',
    price: 125000,
    compareAtPrice: 150000,
    publisher: 'NXB Hội Nhà Văn',
    isbn: '9780451524935',
    pages: 328,
    language: 'vi',
    publishedAt: new Date('1949-06-08'),
    categories: ['van-hoc-nuoc-ngoai'],
    genres: ['dystopian', 'chính trị'],
    stock: 100,
    isAvailable: true,
    featured: true,
    shortDescription: 'Tiểu thuyết dystopian kinh điển về xã hội giám sát toàn diện.',
    description: 'Tác phẩm nổi tiếng của George Orwell về một xã hội tương lai nơi chính phủ kiểm soát mọi khía cạnh của cuộc sống và tư tưởng.',
  },

  // ========== KINH TẾ – KINH DOANH ==========
  {
    name: 'Quản Trị Hiện Đại',
    author: 'Peter Drucker',
    price: 165000,
    compareAtPrice: 200000,
    publisher: 'NXB Kinh Tế',
    isbn: '9780061252662',
    pages: 416,
    language: 'vi',
    publishedAt: new Date('2008-01-01'),
    categories: ['quan-tri'],
    genres: ['quản trị', 'kinh doanh'],
    stock: 75,
    isAvailable: true,
    shortDescription: 'Cẩm nang quản trị doanh nghiệp hiện đại từ bậc thầy quản trị.',
    description: 'Cuốn sách kinh điển về quản trị của Peter Drucker, cha đẻ của quản trị hiện đại, với những nguyên tắc và phương pháp quản lý hiệu quả.',
  },
  {
    name: 'Khởi Nghiệp Tinh Gọn',
    author: 'Eric Ries',
    price: 145000,
    compareAtPrice: 180000,
    publisher: 'NXB Trẻ',
    isbn: '9780307887894',
    pages: 336,
    language: 'vi',
    publishedAt: new Date('2011-09-13'),
    categories: ['khoi-nghiep'],
    genres: ['khởi nghiệp', 'startup'],
    stock: 90,
    isAvailable: true,
    featured: true,
    shortDescription: 'Phương pháp khởi nghiệp hiệu quả với chi phí thấp và rủi ro tối thiểu.',
    description: 'Cuốn sách nổi tiếng về phương pháp Lean Startup, giúp các doanh nhân khởi nghiệp thành công với cách tiếp cận khoa học và tối ưu hóa tài nguyên.',
  },
  {
    name: 'Marketing 4.0',
    author: 'Philip Kotler',
    price: 175000,
    compareAtPrice: 210000,
    publisher: 'NXB Kinh Tế',
    isbn: '9781119341208',
    pages: 208,
    language: 'vi',
    publishedAt: new Date('2016-11-15'),
    categories: ['marketing'],
    genres: ['marketing', 'digital marketing'],
    stock: 85,
    isAvailable: true,
    shortDescription: 'Chiến lược marketing trong kỷ nguyên số và mạng xã hội.',
    description: 'Philip Kotler trình bày cách tiếp cận marketing mới trong thời đại kỹ thuật số, nơi khách hàng có quyền lực và tương tác đa kênh.',
  },
  {
    name: 'Nhà Đầu Tư Thông Minh',
    author: 'Benjamin Graham',
    price: 195000,
    compareAtPrice: 240000,
    publisher: 'NXB Tài Chính',
    isbn: '9780060555665',
    pages: 640,
    language: 'vi',
    publishedAt: new Date('1949-01-01'),
    categories: ['dau-tu-tai-chinh'],
    genres: ['đầu tư', 'tài chính'],
    stock: 70,
    isAvailable: true,
    featured: true,
    shortDescription: 'Cẩm nang đầu tư giá trị từ nhà đầu tư huyền thoại.',
    description: 'Cuốn sách kinh điển về đầu tư giá trị của Benjamin Graham, người thầy của Warren Buffett, với những nguyên tắc đầu tư an toàn và hiệu quả.',
  },
  {
    name: 'Nghệ Thuật Bán Hàng',
    author: 'Zig Ziglar',
    price: 135000,
    compareAtPrice: 170000,
    publisher: 'NXB Kinh Tế',
    isbn: '9780743525077',
    pages: 352,
    language: 'vi',
    publishedAt: new Date('2003-01-01'),
    categories: ['ban-hang'],
    genres: ['bán hàng', 'kỹ năng'],
    stock: 95,
    isAvailable: true,
    shortDescription: 'Bí quyết thành công trong nghề bán hàng từ chuyên gia hàng đầu.',
    description: 'Zig Ziglar chia sẻ những kỹ thuật và nguyên tắc bán hàng hiệu quả, giúp bạn trở thành người bán hàng xuất sắc và xây dựng mối quan hệ lâu dài với khách hàng.',
  },
  {
    name: 'Kinh Tế Học Vĩ Mô',
    author: 'N. Gregory Mankiw',
    price: 225000,
    compareAtPrice: 280000,
    publisher: 'NXB Giáo Dục',
    isbn: '9781429240024',
    pages: 608,
    language: 'vi',
    publishedAt: new Date('2012-01-01'),
    categories: ['kinh-te-hoc'],
    genres: ['kinh tế học', 'giáo trình'],
    stock: 50,
    isAvailable: true,
    shortDescription: 'Giáo trình kinh tế học vĩ mô toàn diện và dễ hiểu.',
    description: 'Cuốn sách giáo khoa kinh tế học vĩ mô nổi tiếng của Mankiw, trình bày các khái niệm và lý thuyết kinh tế vĩ mô một cách rõ ràng và dễ tiếp thu.',
  },

  // ========== KHOA HỌC – CÔNG NGHỆ ==========
  {
    name: 'Vũ Trụ Trong Vỏ Hạt Dẻ',
    author: 'Stephen Hawking',
    price: 155000,
    compareAtPrice: 190000,
    publisher: 'NXB Trẻ',
    isbn: '9780553802023',
    pages: 224,
    language: 'vi',
    publishedAt: new Date('2001-11-06'),
    categories: ['khoa-hoc-tu-nhien'],
    genres: ['vật lý', 'thiên văn học'],
    stock: 60,
    isAvailable: true,
    featured: true,
    shortDescription: 'Khám phá những bí ẩn của vũ trụ từ nhà vật lý thiên tài.',
    description: 'Stephen Hawking giải thích các khái niệm vật lý phức tạp về vũ trụ, lỗ đen và thuyết tương đối một cách dễ hiểu cho độc giả phổ thông.',
  },
  {
    name: 'Clean Code',
    author: 'Robert C. Martin',
    price: 195000,
    compareAtPrice: 240000,
    publisher: 'NXB Công Nghệ',
    isbn: '9780132350884',
    pages: 464,
    language: 'vi',
    publishedAt: new Date('2008-08-11'),
    categories: ['cong-nghe-thong-tin'],
    genres: ['lập trình', 'software engineering'],
    stock: 85,
    isAvailable: true,
    featured: true,
    shortDescription: 'Nghệ thuật viết code sạch và dễ bảo trì.',
    description: 'Cuốn sách kinh điển về lập trình của Uncle Bob, dạy cách viết code sạch, dễ đọc và dễ bảo trì, giúp bạn trở thành lập trình viên chuyên nghiệp.',
  },
  {
    name: 'Machine Learning Yearning',
    author: 'Andrew Ng',
    price: 175000,
    compareAtPrice: 210000,
    publisher: 'NXB Công Nghệ',
    isbn: '9781734223309',
    pages: 288,
    language: 'vi',
    publishedAt: new Date('2018-01-01'),
    categories: ['ai-machine-learning'],
    genres: ['AI', 'machine learning', 'deep learning'],
    stock: 70,
    isAvailable: true,
    featured: true,
    shortDescription: 'Hướng dẫn thực tế về cách xây dựng hệ thống AI thành công.',
    description: 'Andrew Ng chia sẻ kinh nghiệm thực tế về cách phát triển và triển khai các dự án machine learning thành công, từ một trong những chuyên gia hàng đầu thế giới.',
  },
  {
    name: 'Kỹ Thuật Điện Tử Cơ Bản',
    author: 'Nguyễn Văn Hùng',
    price: 145000,
    compareAtPrice: 180000,
    publisher: 'NXB Giáo Dục',
    isbn: '9786042085029',
    pages: 400,
    language: 'vi',
    publishedAt: new Date('2015-01-01'),
    categories: ['ky-thuat'],
    genres: ['kỹ thuật', 'điện tử'],
    stock: 55,
    isAvailable: true,
    shortDescription: 'Giáo trình kỹ thuật điện tử từ cơ bản đến nâng cao.',
    description: 'Cuốn sách giáo khoa về kỹ thuật điện tử, trình bày các nguyên lý và ứng dụng của các linh kiện và mạch điện tử cơ bản.',
  },
  {
    name: 'Toán Học Cao Cấp',
    author: 'Nguyễn Đình Trí',
    price: 185000,
    compareAtPrice: 230000,
    publisher: 'NXB Giáo Dục',
    isbn: '9786042085036',
    pages: 512,
    language: 'vi',
    publishedAt: new Date('2010-01-01'),
    categories: ['toan-hoc'],
    genres: ['toán học', 'giải tích'],
    stock: 40,
    isAvailable: true,
    shortDescription: 'Giáo trình toán học cao cấp cho sinh viên đại học.',
    description: 'Cuốn sách giáo khoa toán học cao cấp bao gồm giải tích, đại số tuyến tính và các ứng dụng trong kỹ thuật và khoa học.',
  },

  // ========== LỊCH SỬ – CHÍNH TRỊ – XÃ HỘI ==========
  {
    name: 'Lịch Sử Thế Giới',
    author: 'E.H. Gombrich',
    price: 195000,
    compareAtPrice: 240000,
    publisher: 'NXB Văn Học',
    isbn: '9780300108835',
    pages: 464,
    language: 'vi',
    publishedAt: new Date('2005-01-01'),
    categories: ['lich-su-the-gioi'],
    genres: ['lịch sử', 'thế giới'],
    stock: 65,
    isAvailable: true,
    featured: true,
    shortDescription: 'Lịch sử thế giới được kể một cách hấp dẫn và dễ hiểu.',
    description: 'E.H. Gombrich kể lại lịch sử thế giới từ thời cổ đại đến hiện đại một cách sinh động và dễ tiếp thu, phù hợp cho mọi lứa tuổi.',
  },
  {
    name: 'Đại Việt Sử Ký Toàn Thư',
    author: 'Ngô Sĩ Liên',
    price: 225000,
    compareAtPrice: 280000,
    publisher: 'NXB Khoa Học Xã Hội',
    isbn: '9786042085043',
    pages: 1200,
    language: 'vi',
    publishedAt: new Date('1697-01-01'),
    categories: ['lich-su-viet-nam'],
    genres: ['lịch sử Việt Nam', 'sử học'],
    stock: 35,
    isAvailable: true,
    featured: true,
    shortDescription: 'Bộ sử ký chính thống của triều đại phong kiến Việt Nam.',
    description: 'Bộ sử ký toàn diện về lịch sử Việt Nam từ thời Hồng Bàng đến thời Lê Trung Hưng, là tài liệu lịch sử quý giá của dân tộc.',
  },
  {
    name: 'Chính Trị Luận',
    author: 'Aristotle',
    price: 145000,
    compareAtPrice: 180000,
    publisher: 'NXB Tri Thức',
    isbn: '9780140444216',
    pages: 368,
    language: 'vi',
    publishedAt: new Date('2000-01-01'), // Classic work, using modern publication date
    categories: ['chinh-tri-phap-luat'],
    genres: ['chính trị', 'triết học'],
    stock: 50,
    isAvailable: true,
    shortDescription: 'Tác phẩm kinh điển về chính trị và nhà nước của Aristotle.',
    description: 'Aristotle phân tích các hình thức nhà nước, công lý và vai trò của công dân trong xã hội, là nền tảng cho tư tưởng chính trị phương Tây.',
  },
  {
    name: 'Triết Học Phương Đông',
    author: 'Nguyễn Duy Cần',
    price: 165000,
    compareAtPrice: 200000,
    publisher: 'NXB Trẻ',
    isbn: '9786042085050',
    pages: 384,
    language: 'vi',
    publishedAt: new Date('1960-01-01'),
    categories: ['triet-hoc'],
    genres: ['triết học', 'phương Đông'],
    stock: 45,
    isAvailable: true,
    shortDescription: 'Giới thiệu tư tưởng triết học phương Đông một cách dễ hiểu.',
    description: 'Nguyễn Duy Cần trình bày các trường phái triết học phương Đông như Phật giáo, Đạo giáo và Nho giáo một cách súc tích và dễ tiếp thu.',
  },
  {
    name: 'Xã Hội Học Đại Cương',
    author: 'Nguyễn Văn Huyên',
    price: 155000,
    compareAtPrice: 190000,
    publisher: 'NXB Giáo Dục',
    isbn: '9786042085067',
    pages: 352,
    language: 'vi',
    publishedAt: new Date('2012-01-01'),
    categories: ['xa-hoi-hoc'],
    genres: ['xã hội học', 'giáo trình'],
    stock: 55,
    isAvailable: true,
    shortDescription: 'Giáo trình xã hội học cơ bản cho sinh viên.',
    description: 'Cuốn sách giáo khoa về xã hội học đại cương, giới thiệu các khái niệm, lý thuyết và phương pháp nghiên cứu xã hội học.',
  },

  // ========== TÂM LÝ – KỸ NĂNG SỐNG ==========
  {
    name: 'Tâm Lý Học Đám Đông',
    author: 'Gustave Le Bon',
    price: 135000,
    compareAtPrice: 170000,
    publisher: 'NXB Tri Thức',
    isbn: '9780140041994',
    pages: 256,
    language: 'vi',
    publishedAt: new Date('1895-01-01'),
    categories: ['tam-ly-hoc'],
    genres: ['tâm lý học', 'xã hội'],
    stock: 70,
    isAvailable: true,
    featured: true,
    shortDescription: 'Nghiên cứu về hành vi và tâm lý của đám đông.',
    description: 'Gustave Le Bon phân tích cách đám đông suy nghĩ và hành động khác với cá nhân, là tác phẩm kinh điển về tâm lý học xã hội.',
  },
  {
    name: 'Sức Mạnh Của Tĩnh Lặng',
    author: 'Eckhart Tolle',
    price: 145000,
    compareAtPrice: 180000,
    publisher: 'NXB Trẻ',
    isbn: '9781577314806',
    pages: 288,
    language: 'vi',
    publishedAt: new Date('2003-01-01'),
    categories: ['tam-linh'],
    genres: ['tâm linh', 'thiền định'],
    stock: 85,
    isAvailable: true,
    shortDescription: 'Khám phá sức mạnh của sự tĩnh lặng và sống trong hiện tại.',
    description: 'Eckhart Tolle hướng dẫn cách sống trong hiện tại, giải phóng khỏi những suy nghĩ tiêu cực và tìm thấy bình an nội tâm.',
  },
  {
    name: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    price: 125000,
    compareAtPrice: 150000,
    publisher: 'NXB Trẻ',
    isbn: '9780671027032',
    pages: 320,
    language: 'vi',
    publishedAt: new Date('1936-01-01'),
    categories: ['ky-nang-giao-tiep'],
    genres: ['giao tiếp', 'kỹ năng sống'],
    stock: 200,
    isAvailable: true,
    featured: true,
    isHot: true,
    shortDescription: 'Nghệ thuật thu phục lòng người và thành công trong giao tiếp.',
    description: 'Cuốn sách self-help kinh điển của Dale Carnegie về cách xây dựng mối quan hệ tốt đẹp, giao tiếp hiệu quả và thành công trong cuộc sống.',
  },
  {
    name: '7 Thói Quen Của Người Thành Đạt',
    author: 'Stephen R. Covey',
    price: 165000,
    compareAtPrice: 200000,
    publisher: 'NXB Trẻ',
    isbn: '9780743269513',
    pages: 384,
    language: 'vi',
    publishedAt: new Date('1989-08-15'),
    categories: ['phat-trien-ban-than'],
    genres: ['phát triển bản thân', 'lãnh đạo'],
    stock: 150,
    isAvailable: true,
    featured: true,
    isHot: true,
    shortDescription: '7 nguyên tắc sống giúp bạn đạt được thành công và hạnh phúc.',
    description: 'Stephen Covey trình bày 7 thói quen hiệu quả giúp bạn phát triển bản thân, xây dựng mối quan hệ tốt và đạt được mục tiêu trong cuộc sống.',
  },
  {
    name: 'Lối Sống Tối Giản',
    author: 'Marie Kondo',
    price: 115000,
    compareAtPrice: 140000,
    publisher: 'NXB Trẻ',
    isbn: '9781607747307',
    pages: 224,
    language: 'vi',
    publishedAt: new Date('2014-10-14'),
    categories: ['thien-song-toi-gian'],
    genres: ['sống tối giản', 'tổ chức'],
    stock: 110,
    isAvailable: true,
    featured: true,
    shortDescription: 'Nghệ thuật dọn dẹp và sống tối giản để có cuộc sống hạnh phúc hơn.',
    description: 'Marie Kondo chia sẻ phương pháp KonMari giúp bạn dọn dẹp nhà cửa và cuộc sống, chỉ giữ lại những thứ mang lại niềm vui thực sự.',
  },

  // ========== THIẾU NHI – GIÁO DỤC ==========
  {
    name: 'Doraemon - Tập 1',
    author: 'Fujiko F. Fujio',
    price: 25000,
    compareAtPrice: 30000,
    publisher: 'NXB Kim Đồng',
    isbn: '9786042085074',
    pages: 192,
    language: 'vi',
    publishedAt: new Date('1969-12-01'),
    categories: ['truyen-tranh'],
    genres: ['truyện tranh', 'thiếu nhi'],
    stock: 300,
    isAvailable: true,
    featured: true,
    isHot: true,
    shortDescription: 'Truyện tranh Nhật Bản nổi tiếng về chú mèo máy Doraemon.',
    description: 'Câu chuyện về chú mèo máy Doraemon đến từ tương lai để giúp đỡ cậu bé Nobita, một trong những bộ truyện tranh được yêu thích nhất thế giới.',
  },
  {
    name: 'Sách Tô Màu Cho Bé - Động Vật',
    author: 'Nhóm Tác Giả',
    price: 35000,
    compareAtPrice: 45000,
    publisher: 'NXB Mỹ Thuật',
    isbn: '9786042085081',
    pages: 48,
    language: 'vi',
    publishedAt: new Date('2020-01-01'),
    categories: ['sach-mau'],
    genres: ['sách màu', 'thiếu nhi'],
    stock: 250,
    isAvailable: true,
    shortDescription: 'Sách tô màu các loài động vật dễ thương cho trẻ em.',
    description: 'Sách tô màu với hình ảnh các loài động vật đáng yêu, giúp trẻ phát triển khả năng sáng tạo và nhận biết màu sắc.',
  },
  {
    name: 'Giáo Trình Toán Lớp 1',
    author: 'Bộ Giáo Dục và Đào Tạo',
    price: 45000,
    compareAtPrice: 55000,
    publisher: 'NXB Giáo Dục Việt Nam',
    isbn: '9786042085098',
    pages: 120,
    language: 'vi',
    publishedAt: new Date('2023-01-01'),
    categories: ['giao-trinh'],
    genres: ['giáo trình', 'toán học'],
    stock: 500,
    isAvailable: true,
    shortDescription: 'Giáo trình toán học chính thức cho học sinh lớp 1.',
    description: 'Sách giáo khoa toán lớp 1 theo chương trình giáo dục phổ thông mới, giúp học sinh làm quen với các khái niệm toán học cơ bản.',
  },
  {
    name: 'English For Kids - Tập 1',
    author: 'Oxford University Press',
    price: 85000,
    compareAtPrice: 100000,
    publisher: 'NXB Giáo Dục',
    isbn: '9780194408634',
    pages: 96,
    language: 'vi',
    publishedAt: new Date('2018-01-01'),
    categories: ['sach-hoc-tieng-anh'],
    genres: ['tiếng Anh', 'giáo dục'],
    stock: 180,
    isAvailable: true,
    featured: true,
    shortDescription: 'Sách học tiếng Anh cho trẻ em với phương pháp vui nhộn.',
    description: 'Giáo trình tiếng Anh dành cho trẻ em với các hoạt động vui nhộn, bài hát và trò chơi giúp trẻ học tiếng Anh một cách tự nhiên và hiệu quả.',
  },
  {
    name: 'STEM Cho Trẻ - Robotics Cơ Bản',
    author: 'Nhóm Tác Giả',
    price: 125000,
    compareAtPrice: 150000,
    publisher: 'NXB Khoa Học',
    isbn: '9786042085104',
    pages: 160,
    language: 'vi',
    publishedAt: new Date('2022-01-01'),
    categories: ['stem-cho-tre'],
    genres: ['STEM', 'robotics', 'khoa học'],
    stock: 95,
    isAvailable: true,
    featured: true,
    shortDescription: 'Giới thiệu robotics và lập trình cho trẻ em.',
    description: 'Sách hướng dẫn trẻ em làm quen với robotics và lập trình cơ bản thông qua các dự án thực hành vui nhộn và giáo dục.',
  },
];

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

// Fallback images nếu không tìm thấy hình ảnh riêng
const fallbackImages = [
  '/assets/img/book/01.png',
  '/assets/img/book/02.png',
  '/assets/img/book/03.png',
  '/assets/img/book/04.png',
  '/assets/img/book/05.png',
  '/assets/img/book/06.png',
  '/assets/img/book/07.png',
  '/assets/img/book/08.png',
  '/assets/img/book/09.png',
  '/assets/img/book/10.png',
  '/assets/img/book/11.png'
];

async function seedProducts() {
  try {
    console.log('🗑️  Đang xóa tất cả products cũ...');
    const deleteResult = await Product.deleteMany({});
    console.log(`   ✅ Đã xóa ${deleteResult.deletedCount} products`);

    console.log('\n📚 Đang seed products mới...');
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = sampleProducts[i];
      try {
        // Tìm hình ảnh tương ứng với sản phẩm
        let images;
        const mappedImage = productImageMap[productData.name];
        
        if (mappedImage) {
          // Sử dụng hình ảnh từ mapping (không encode để giữ tên file gốc)
          images = [`/uploads/products/${mappedImage}`];
        } else {
          // Sử dụng fallback image
          const imageIndex = i % fallbackImages.length;
          images = [fallbackImages[imageIndex]];
        }

        const product = new Product({
          ...productData,
          slug: slugify(productData.name),
          images: images,
        });

        await product.save();
        console.log(`   ✅ Đã tạo: ${product.name} (${product.categories.join(', ')}) - Image: ${images[0]}`);
        created++;
      } catch (error) {
        console.error(`   ❌ Lỗi tạo ${productData.name}:`, error.message);
        skipped++;
      }
    }

    return { created, skipped };
  } catch (error) {
    console.error('❌ Lỗi seed products:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await connectDB();

    const result = await seedProducts();
    
    console.log('\n✨ Hoàn thành seed dữ liệu!');
    console.log(`   ✅ Tạo mới: ${result.created} products`);
    console.log(`   ⏭️  Bỏ qua: ${result.skipped} products`);
    
    const totalProducts = await Product.countDocuments();
    const byCategory = {};
    
    // Count by category
    for (const product of sampleProducts) {
      product.categories.forEach(cat => {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });
    }
    
    console.log('\n📊 Thống kê theo danh mục:');
    Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} sản phẩm`);
    });
    
    console.log(`\n📘 Tổng số products trong database: ${totalProducts}`);
  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

main();

