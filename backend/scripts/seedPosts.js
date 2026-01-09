"use strict";

import dotenv from 'dotenv';
dotenv.config();
import Post from '../models/Post.js';
import { connectDB, disconnectDB } from '../db/index.js';

// Helper function to create slug
const slugify = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const samplePosts = [
  // Blog Posts
  {
    title: '10 Cuốn Sách Hay Nhất Năm 2024 Bạn Nên Đọc',
    excerpt: 'Khám phá những cuốn sách được đánh giá cao nhất trong năm 2024, từ tiểu thuyết đến sách phi hư cấu.',
    content: `
      <h2>Giới thiệu</h2>
      <p>Năm 2024 đã mang đến nhiều tác phẩm văn học xuất sắc từ các tác giả trong nước và quốc tế. Dưới đây là danh sách 10 cuốn sách hay nhất mà bạn không nên bỏ lỡ.</p>
      
      <h3>1. Tôi Thấy Hoa Vàng Trên Cỏ Xanh - Nguyễn Nhật Ánh</h3>
      <p>Một tác phẩm kinh điển về tuổi thơ với những ký ức trong trẻo và xúc động. Cuốn sách đưa người đọc trở về với những năm tháng đẹp đẽ nhất của đời người.</p>
      
      <h3>2. Rừng Na Uy - Haruki Murakami</h3>
      <p>Tiểu thuyết trưởng thành nổi tiếng với giọng kể trữ tình và sâu sắc, phản ánh thế hệ trẻ Nhật Bản trong những năm 1960.</p>
      
      <h3>3. Nhà Giả Kim - Paulo Coelho</h3>
      <p>Cuốn sách triết học và tâm linh sâu sắc về hành trình tìm kiếm ý nghĩa cuộc sống và theo đuổi giấc mơ của mình.</p>
      
      <h3>4. Harry Potter Và Hòn Đá Phù Thủy - J.K. Rowling</h3>
      <p>Khởi đầu của bộ truyện tạo nên hiện tượng văn học toàn cầu, đưa độc giả vào thế giới phép thuật đầy kỳ diệu.</p>
      
      <h3>5. Mật Mã Da Vinci - Dan Brown</h3>
      <p>Tiểu thuyết trinh thám hấp dẫn kết hợp lịch sử và tôn giáo, tạo nên một câu chuyện đầy bí ẩn và ly kỳ.</p>
      
      <h3>6. Đắc Nhân Tâm - Dale Carnegie</h3>
      <p>Cuốn sách self-help kinh điển về nghệ thuật giao tiếp và ứng xử trong cuộc sống, giúp bạn xây dựng mối quan hệ tốt đẹp với mọi người.</p>
      
      <h3>7. Sapiens - Yuval Noah Harari</h3>
      <p>Lịch sử ngắn gọn của loài người, khám phá cách con người đã phát triển và thống trị thế giới.</p>
      
      <h3>8. Tôi Tài Giỏi, Bạn Cũng Thế - Adam Khoo</h3>
      <p>Cuốn sách về phương pháp học tập hiệu quả và phát triển tư duy tích cực, giúp bạn đạt được thành công trong học tập và cuộc sống.</p>
      
      <h3>9. Người Giàu Nhất Thành Babylon - George S. Clason</h3>
      <p>Những nguyên tắc quản lý tài chính cổ xưa nhưng vẫn còn giá trị đến ngày nay, giúp bạn xây dựng sự giàu có.</p>
      
      <h3>10. Tư Duy Nhanh Và Chậm - Daniel Kahneman</h3>
      <p>Khám phá cách bộ não hoạt động và cách chúng ta đưa ra quyết định, giúp bạn hiểu rõ hơn về tư duy của chính mình.</p>
      
      <h2>Kết luận</h2>
      <p>Mỗi cuốn sách trên đều mang đến những giá trị riêng biệt và có thể thay đổi cách bạn nhìn nhận về cuộc sống. Hãy dành thời gian để đọc và suy ngẫm về những thông điệp mà chúng mang lại.</p>
    `,
    category: 'Blog',
    author: 'Admin',
    tags: ['sách hay', 'đọc sách', 'văn học', 'review sách'],
    featuredImage: '/assets/img/book/01.png',
    isPublished: true,
    publishedAt: new Date('2024-01-15'),
    meta: {
      title: '10 Cuốn Sách Hay Nhất Năm 2024',
      description: 'Danh sách 10 cuốn sách được đánh giá cao nhất trong năm 2024, từ tiểu thuyết đến sách phi hư cấu.',
      keywords: ['sách hay', 'đọc sách', 'văn học', 'review sách', '2024']
    }
  },
  {
    title: 'Cách Xây Dựng Thói Quen Đọc Sách Mỗi Ngày',
    excerpt: 'Khám phá những bí quyết đơn giản để hình thành và duy trì thói quen đọc sách hàng ngày, giúp bạn mở rộng kiến thức và phát triển bản thân.',
    content: `
      <h2>Tại sao đọc sách lại quan trọng?</h2>
      <p>Đọc sách không chỉ là một hoạt động giải trí mà còn là cách hiệu quả để mở rộng kiến thức, phát triển tư duy và cải thiện khả năng giao tiếp. Nhiều nghiên cứu đã chứng minh rằng những người đọc sách thường xuyên có khả năng tư duy tốt hơn và thành công hơn trong cuộc sống.</p>
      
      <h2>Bí quyết xây dựng thói quen đọc sách</h2>
      
      <h3>1. Bắt đầu với những cuốn sách ngắn</h3>
      <p>Đừng ép bản thân phải đọc những cuốn sách dày hàng trăm trang ngay từ đầu. Hãy bắt đầu với những cuốn sách ngắn, dễ đọc để tạo động lực ban đầu.</p>
      
      <h3>2. Đặt mục tiêu đọc hàng ngày</h3>
      <p>Hãy đặt mục tiêu đọc ít nhất 10-20 trang mỗi ngày. Điều này sẽ giúp bạn hình thành thói quen một cách tự nhiên và không cảm thấy quá áp lực.</p>
      
      <h3>3. Tạo không gian đọc sách thoải mái</h3>
      <p>Chuẩn bị một góc đọc sách yên tĩnh, có đủ ánh sáng và không bị làm phiền. Điều này sẽ giúp bạn tập trung tốt hơn và tận hưởng trải nghiệm đọc sách.</p>
      
      <h3>4. Mang sách theo bên mình</h3>
      <p>Luôn mang theo một cuốn sách bên mình để có thể đọc trong những khoảng thời gian rảnh như khi chờ xe bus, trong giờ nghỉ trưa, hoặc trước khi đi ngủ.</p>
      
      <h3>5. Tham gia câu lạc bộ đọc sách</h3>
      <p>Tham gia các câu lạc bộ đọc sách hoặc nhóm thảo luận sẽ giúp bạn có động lực đọc và chia sẻ những suy nghĩ về sách với người khác.</p>
      
      <h3>6. Đọc đa dạng các thể loại</h3>
      <p>Đừng chỉ đọc một thể loại sách. Hãy thử đọc nhiều thể loại khác nhau để mở rộng kiến thức và tìm ra những cuốn sách bạn thực sự yêu thích.</p>
      
      <h3>7. Ghi chú và suy ngẫm</h3>
      <p>Hãy ghi chú lại những đoạn hay, những ý tưởng quan trọng và suy ngẫm về chúng. Điều này sẽ giúp bạn nhớ lâu hơn và áp dụng được những kiến thức đã học.</p>
      
      <h2>Lợi ích của việc đọc sách thường xuyên</h2>
      <ul>
        <li>Mở rộng vốn từ vựng và khả năng giao tiếp</li>
        <li>Cải thiện khả năng tập trung và tư duy phản biện</li>
        <li>Giảm căng thẳng và cải thiện sức khỏe tinh thần</li>
        <li>Mở rộng kiến thức về nhiều lĩnh vực khác nhau</li>
        <li>Phát triển trí tưởng tượng và khả năng sáng tạo</li>
      </ul>
      
      <h2>Kết luận</h2>
      <p>Xây dựng thói quen đọc sách không phải là điều dễ dàng, nhưng với sự kiên trì và áp dụng những bí quyết trên, bạn chắc chắn sẽ thành công. Hãy bắt đầu ngay hôm nay và trải nghiệm những lợi ích tuyệt vời mà việc đọc sách mang lại!</p>
    `,
    category: 'Blog',
    author: 'Admin',
    tags: ['thói quen đọc sách', 'phát triển bản thân', 'kỹ năng sống'],
    featuredImage: '/assets/img/book/02.png',
    isPublished: true,
    publishedAt: new Date('2024-02-10'),
    meta: {
      title: 'Cách Xây Dựng Thói Quen Đọc Sách Mỗi Ngày',
      description: 'Bí quyết đơn giản để hình thành và duy trì thói quen đọc sách hàng ngày.',
      keywords: ['đọc sách', 'thói quen', 'phát triển bản thân', 'kỹ năng sống']
    }
  },
  {
    title: 'Top 5 Tác Giả Việt Nam Được Yêu Thích Nhất',
    excerpt: 'Khám phá những tác giả Việt Nam nổi tiếng và được độc giả yêu thích nhất với những tác phẩm để đời.',
    content: `
      <h2>Giới thiệu</h2>
      <p>Văn học Việt Nam có một lịch sử lâu đời và phong phú với nhiều tác giả tài năng. Dưới đây là danh sách 5 tác giả Việt Nam được yêu thích nhất hiện nay.</p>
      
      <h3>1. Nguyễn Nhật Ánh</h3>
      <p>Nguyễn Nhật Ánh là một trong những nhà văn Việt Nam được yêu thích nhất, đặc biệt là với độc giả trẻ. Các tác phẩm của ông như "Kính vạn hoa", "Tôi thấy hoa vàng trên cỏ xanh", "Cây chuối non đi giày xanh" đã trở thành những cuốn sách kinh điển của văn học thiếu nhi Việt Nam.</p>
      
      <h3>2. Nguyễn Ngọc Tư</h3>
      <p>Nguyễn Ngọc Tư là một nhà văn nữ tài năng với những tác phẩm mang đậm chất Nam Bộ. Các tác phẩm của bà như "Cánh đồng bất tận", "Giao thừa" đã để lại ấn tượng sâu sắc trong lòng độc giả.</p>
      
      <h3>3. Nguyễn Quang Thiều</h3>
      <p>Nguyễn Quang Thiều là một nhà thơ và nhà văn đa tài với nhiều tác phẩm nổi tiếng. Ông được biết đến với những bài thơ đầy cảm xúc và những tiểu thuyết sâu sắc về cuộc sống.</p>
      
      <h3>4. Nguyễn Bình Phương</h3>
      <p>Nguyễn Bình Phương là một nhà văn với phong cách viết độc đáo và sáng tạo. Các tác phẩm của ông như "Người đi vắng", "Những đứa con của mẹ" đã được đánh giá cao về mặt nghệ thuật.</p>
      
      <h3>5. Nguyễn Việt Hà</h3>
      <p>Nguyễn Việt Hà là một nhà văn trẻ với những tác phẩm hiện đại và gần gũi với cuộc sống đương đại. Các tác phẩm của ông như "Cơ hội của Chúa", "Khải huyền muộn" đã thu hút được sự chú ý của độc giả.</p>
      
      <h2>Kết luận</h2>
      <p>Những tác giả trên đều đã đóng góp quan trọng cho nền văn học Việt Nam và để lại những tác phẩm có giá trị lâu dài. Hãy khám phá và đọc những tác phẩm của họ để hiểu thêm về văn học Việt Nam.</p>
    `,
    category: 'Blog',
    author: 'Admin',
    tags: ['tác giả Việt Nam', 'văn học Việt Nam', 'văn học'],
    featuredImage: '/assets/img/book/03.png',
    isPublished: true,
    publishedAt: new Date('2024-03-05'),
    meta: {
      title: 'Top 5 Tác Giả Việt Nam Được Yêu Thích Nhất',
      description: 'Khám phá những tác giả Việt Nam nổi tiếng và được độc giả yêu thích nhất.',
      keywords: ['tác giả Việt Nam', 'văn học Việt Nam', 'văn học']
    }
  },
  
  // News Posts
  {
    title: 'Khai Trương Cửa Hàng Sách Mới Tại Hà Nội',
    excerpt: 'Cửa hàng sách mới của chúng tôi đã chính thức khai trương tại trung tâm Hà Nội với hơn 10.000 đầu sách đa dạng.',
    content: `
      <h2>Thông báo khai trương</h2>
      <p>Chúng tôi vui mừng thông báo về việc khai trương cửa hàng sách mới tại địa chỉ 123 Phố Huế, Quận Hai Bà Trưng, Hà Nội. Cửa hàng mới sẽ mang đến cho khách hàng một không gian đọc sách hiện đại và thoải mái.</p>
      
      <h3>Đặc điểm nổi bật</h3>
      <ul>
        <li>Hơn 10.000 đầu sách đa dạng các thể loại</li>
        <li>Không gian đọc sách rộng rãi và thoải mái</li>
        <li>Khu vực cà phê tích hợp để bạn có thể vừa đọc sách vừa thưởng thức đồ uống</li>
        <li>Khu vực dành cho trẻ em với nhiều sách thiếu nhi</li>
        <li>Hệ thống tìm kiếm sách thông minh</li>
      </ul>
      
      <h3>Chương trình khuyến mãi khai trương</h3>
      <p>Nhân dịp khai trương, chúng tôi có nhiều chương trình khuyến mãi hấp dẫn:</p>
      <ul>
        <li>Giảm giá 20% cho tất cả các loại sách trong tuần đầu tiên</li>
        <li>Tặng voucher 50.000đ cho khách hàng mua sách trên 200.000đ</li>
        <li>Tặng bookmark độc quyền cho 100 khách hàng đầu tiên</li>
      </ul>
      
      <h3>Thời gian hoạt động</h3>
      <p>Cửa hàng mở cửa từ 8:00 - 22:00 hàng ngày, kể cả cuối tuần và ngày lễ.</p>
      
      <h2>Lời cảm ơn</h2>
      <p>Chúng tôi xin chân thành cảm ơn sự ủng hộ của quý khách hàng và mong được phục vụ quý khách tại cửa hàng mới!</p>
    `,
    category: 'News',
    author: 'Admin',
    tags: ['khai trương', 'cửa hàng', 'Hà Nội', 'sự kiện'],
    featuredImage: '/assets/img/book/04.png',
    isPublished: true,
    publishedAt: new Date('2024-01-20'),
    meta: {
      title: 'Khai Trương Cửa Hàng Sách Mới Tại Hà Nội',
      description: 'Cửa hàng sách mới đã chính thức khai trương tại Hà Nội với nhiều ưu đãi hấp dẫn.',
      keywords: ['khai trương', 'cửa hàng', 'Hà Nội', 'sách']
    }
  },
  {
    title: 'Chương Trình Tặng Sách Miễn Phí Cho Trẻ Em',
    excerpt: 'Nhằm khuyến khích văn hóa đọc, chúng tôi tổ chức chương trình tặng sách miễn phí cho trẻ em tại các trường học.',
    content: `
      <h2>Giới thiệu chương trình</h2>
      <p>Với mong muốn khuyến khích văn hóa đọc và phát triển tình yêu sách cho trẻ em, chúng tôi đã phát động chương trình "Tặng sách cho trẻ em" tại các trường học trên địa bàn thành phố.</p>
      
      <h3>Mục tiêu chương trình</h3>
      <ul>
        <li>Khuyến khích trẻ em đọc sách từ nhỏ</li>
        <li>Phát triển tư duy và trí tưởng tượng của trẻ</li>
        <li>Tạo thói quen đọc sách tích cực</li>
        <li>Hỗ trợ các trường học thiếu tài liệu đọc</li>
      </ul>
      
      <h3>Đối tượng tham gia</h3>
      <p>Chương trình dành cho:</p>
      <ul>
        <li>Trẻ em từ 6-12 tuổi</li>
        <li>Các trường tiểu học và trung học cơ sở</li>
        <li>Các trung tâm giáo dục và thư viện công cộng</li>
      </ul>
      
      <h3>Loại sách được tặng</h3>
      <p>Chúng tôi sẽ tặng các loại sách phù hợp với lứa tuổi:</p>
      <ul>
        <li>Sách truyện thiếu nhi</li>
        <li>Sách khoa học dành cho trẻ em</li>
        <li>Sách lịch sử và địa lý</li>
        <li>Sách kỹ năng sống</li>
        <li>Truyện tranh giáo dục</li>
      </ul>
      
      <h3>Cách thức tham gia</h3>
      <p>Để tham gia chương trình, các trường học và tổ chức có thể:</p>
      <ol>
        <li>Đăng ký tham gia qua website hoặc email</li>
        <li>Gửi thông tin về số lượng học sinh và nhu cầu sách</li>
        <li>Chúng tôi sẽ liên hệ và sắp xếp thời gian trao tặng</li>
      </ol>
      
      <h2>Kết luận</h2>
      <p>Chúng tôi hy vọng chương trình này sẽ góp phần phát triển văn hóa đọc và mang lại niềm vui đọc sách cho nhiều trẻ em hơn nữa.</p>
    `,
    category: 'News',
    author: 'Admin',
    tags: ['từ thiện', 'trẻ em', 'giáo dục', 'sự kiện'],
    featuredImage: '/assets/img/book/05.png',
    isPublished: true,
    publishedAt: new Date('2024-02-15'),
    meta: {
      title: 'Chương Trình Tặng Sách Miễn Phí Cho Trẻ Em',
      description: 'Chương trình tặng sách miễn phí cho trẻ em nhằm khuyến khích văn hóa đọc.',
      keywords: ['từ thiện', 'trẻ em', 'giáo dục', 'sách']
    }
  },
  {
    title: 'Ra Mắt Bộ Sưu Tập Sách Mới Nhất',
    excerpt: 'Chúng tôi tự hào giới thiệu bộ sưu tập sách mới nhất với nhiều đầu sách độc quyền và bestseller quốc tế.',
    content: `
      <h2>Giới thiệu bộ sưu tập</h2>
      <p>Chúng tôi vui mừng giới thiệu bộ sưu tập sách mới nhất với hơn 500 đầu sách được tuyển chọn kỹ lưỡng từ các nhà xuất bản uy tín trong và ngoài nước.</p>
      
      <h3>Các thể loại sách trong bộ sưu tập</h3>
      <ul>
        <li><strong>Văn học:</strong> Tiểu thuyết, truyện ngắn, thơ ca từ các tác giả nổi tiếng</li>
        <li><strong>Khoa học:</strong> Sách về khoa học tự nhiên, công nghệ, y học</li>
        <li><strong>Lịch sử:</strong> Sách về lịch sử Việt Nam và thế giới</li>
        <li><strong>Kinh doanh:</strong> Sách về quản lý, marketing, khởi nghiệp</li>
        <li><strong>Self-help:</strong> Sách phát triển bản thân và kỹ năng sống</li>
        <li><strong>Thiếu nhi:</strong> Sách truyện và giáo dục dành cho trẻ em</li>
      </ul>
      
      <h3>Điểm nổi bật</h3>
      <ul>
        <li>Nhiều đầu sách độc quyền chưa từng có tại Việt Nam</li>
        <li>Bestseller quốc tế được dịch sang tiếng Việt</li>
        <li>Sách của các tác giả đoạt giải Nobel, Pulitzer</li>
        <li>Bản đặc biệt với bìa cứng và minh họa đẹp mắt</li>
      </ul>
      
      <h3>Chương trình ưu đãi</h3>
      <p>Nhân dịp ra mắt bộ sưu tập mới:</p>
      <ul>
        <li>Giảm giá 15% cho tất cả sách trong bộ sưu tập</li>
        <li>Tặng bookmark và túi vải độc quyền khi mua từ 3 cuốn trở lên</li>
        <li>Miễn phí vận chuyển cho đơn hàng trên 300.000đ</li>
      </ul>
      
      <h2>Kết luận</h2>
      <p>Hãy đến cửa hàng hoặc truy cập website của chúng tôi để khám phá bộ sưu tập sách mới nhất và tìm cho mình những cuốn sách yêu thích!</p>
    `,
    category: 'News',
    author: 'Admin',
    tags: ['sách mới', 'bộ sưu tập', 'sản phẩm', 'ra mắt'],
    featuredImage: '/assets/img/book/06.png',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    meta: {
      title: 'Ra Mắt Bộ Sưu Tập Sách Mới Nhất',
      description: 'Giới thiệu bộ sưu tập sách mới với nhiều đầu sách độc quyền và bestseller.',
      keywords: ['sách mới', 'bộ sưu tập', 'sản phẩm']
    }
  },
  {
    title: 'Hội Sách Mùa Thu 2024 - Sự Kiện Không Thể Bỏ Lỡ',
    excerpt: 'Hội sách mùa thu 2024 sẽ diễn ra với nhiều hoạt động thú vị, tác giả ký tặng và chương trình khuyến mãi đặc biệt.',
    content: `
      <h2>Thông tin sự kiện</h2>
      <p>Hội sách mùa thu 2024 - sự kiện văn hóa lớn nhất trong năm dành cho những người yêu sách sẽ được tổ chức tại Công viên Thống Nhất, Hà Nội từ ngày 15-20 tháng 10 năm 2024.</p>
      
      <h3>Hoạt động chính</h3>
      <ul>
        <li><strong>Triển lãm sách:</strong> Hơn 50.000 đầu sách từ các nhà xuất bản hàng đầu</li>
        <li><strong>Gặp gỡ tác giả:</strong> Nhiều tác giả nổi tiếng sẽ có mặt để ký tặng và giao lưu với độc giả</li>
        <li><strong>Hội thảo:</strong> Các buổi hội thảo về văn học, xuất bản và văn hóa đọc</li>
        <li><strong>Hoạt động cho trẻ em:</strong> Khu vực đọc sách và vẽ tranh dành cho thiếu nhi</li>
        <li><strong>Chương trình nghệ thuật:</strong> Biểu diễn kịch, đọc thơ và âm nhạc</li>
      </ul>
      
      <h3>Danh sách tác giả tham gia</h3>
      <ul>
        <li>Nguyễn Nhật Ánh</li>
        <li>Nguyễn Ngọc Tư</li>
        <li>Nguyễn Quang Thiều</li>
        <li>Và nhiều tác giả khác</li>
      </ul>
      
      <h3>Chương trình khuyến mãi</h3>
      <p>Trong suốt thời gian diễn ra hội sách:</p>
      <ul>
        <li>Giảm giá lên đến 50% cho nhiều đầu sách</li>
        <li>Tặng quà cho khách hàng mua sách</li>
        <li>Rút thăm trúng thưởng với nhiều giải thưởng hấp dẫn</li>
        <li>Miễn phí vào cửa cho tất cả mọi người</li>
      </ul>
      
      <h3>Thời gian và địa điểm</h3>
      <p><strong>Thời gian:</strong> 15-20 tháng 10, 2024<br>
      <strong>Địa điểm:</strong> Công viên Thống Nhất, Hà Nội<br>
      <strong>Giờ mở cửa:</strong> 8:00 - 22:00 hàng ngày</p>
      
      <h2>Lời mời</h2>
      <p>Chúng tôi trân trọng kính mời quý khách hàng và những người yêu sách đến tham gia Hội sách mùa thu 2024. Đây sẽ là cơ hội tuyệt vời để khám phá những cuốn sách mới và gặp gỡ những người cùng đam mê!</p>
    `,
    category: 'News',
    author: 'Admin',
    tags: ['hội sách', 'sự kiện', 'văn hóa', 'Hà Nội'],
    featuredImage: '/assets/img/book/07.png',
    isPublished: true,
    publishedAt: new Date('2024-09-10'),
    meta: {
      title: 'Hội Sách Mùa Thu 2024 - Sự Kiện Không Thể Bỏ Lỡ',
      description: 'Hội sách mùa thu 2024 với nhiều hoạt động thú vị và chương trình khuyến mãi đặc biệt.',
      keywords: ['hội sách', 'sự kiện', 'văn hóa', 'Hà Nội']
    }
  },
  {
    title: 'Ứng Dụng Đọc Sách Online Mới Ra Mắt',
    excerpt: 'Chúng tôi tự hào giới thiệu ứng dụng đọc sách online mới với nhiều tính năng hiện đại và thư viện sách phong phú.',
    content: `
      <h2>Giới thiệu ứng dụng</h2>
      <p>Nhằm đáp ứng nhu cầu đọc sách online ngày càng tăng, chúng tôi đã phát triển và ra mắt ứng dụng đọc sách mới với nhiều tính năng hiện đại và thư viện sách phong phú.</p>
      
      <h3>Tính năng nổi bật</h3>
      <ul>
        <li><strong>Thư viện sách lớn:</strong> Hơn 50.000 đầu sách đa dạng các thể loại</li>
        <li><strong>Đọc offline:</strong> Tải sách về để đọc khi không có internet</li>
        <li><strong>Đồng bộ đa thiết bị:</strong> Đọc trên điện thoại, tablet và máy tính</li>
        <li><strong>Ghi chú và bookmark:</strong> Ghi chú và đánh dấu những đoạn hay</li>
        <li><strong>Chế độ đọc tối:</strong> Bảo vệ mắt khi đọc ban đêm</li>
        <li><strong>Tìm kiếm thông minh:</strong> Tìm kiếm nội dung trong sách một cách nhanh chóng</li>
        <li><strong>Đề xuất cá nhân hóa:</strong> Gợi ý sách phù hợp với sở thích của bạn</li>
      </ul>
      
      <h3>Cách tải và sử dụng</h3>
      <p>Ứng dụng có sẵn trên:</p>
      <ul>
        <li>App Store (iOS)</li>
        <li>Google Play (Android)</li>
        <li>Website (Desktop và Mobile)</li>
      </ul>
      
      <h3>Chương trình khuyến mãi ra mắt</h3>
      <p>Nhân dịp ra mắt ứng dụng:</p>
      <ul>
        <li>Miễn phí đọc trong 30 ngày đầu tiên</li>
        <li>Giảm 50% phí đăng ký tháng đầu tiên</li>
        <li>Tặng 3 cuốn sách bestseller khi đăng ký gói năm</li>
      </ul>
      
      <h2>Kết luận</h2>
      <p>Hãy tải ứng dụng ngay hôm nay để trải nghiệm cách đọc sách hiện đại và tiện lợi nhất!</p>
    `,
    category: 'News',
    author: 'Admin',
    tags: ['ứng dụng', 'công nghệ', 'đọc sách online', 'ra mắt'],
    featuredImage: '/assets/img/book/08.png',
    isPublished: true,
    publishedAt: new Date('2024-04-12'),
    meta: {
      title: 'Ứng Dụng Đọc Sách Online Mới Ra Mắt',
      description: 'Giới thiệu ứng dụng đọc sách online mới với nhiều tính năng hiện đại.',
      keywords: ['ứng dụng', 'công nghệ', 'đọc sách online']
    }
  }
];

async function seedPosts() {
  let created = 0;
  let skipped = 0;

  for (const postData of samplePosts) {
    const existing = await Post.findOne({ title: postData.title });
    if (existing) {
      skipped++;
      continue;
    }

    const post = new Post({
      ...postData,
      slug: postData.slug || slugify(postData.title),
    });

    await post.save();
    created++;
  }

  return { created, skipped };
}

async function main() {
  try {
    console.log('📝 Đang seed bài viết Blog và Tin Tức...');
    await connectDB();

    const postsResult = await seedPosts();
    console.log(`   ✅ Tạo mới: ${postsResult.created}`);
    console.log(`   ⏭️  Bỏ qua: ${postsResult.skipped}`);

    const totalPosts = await Post.countDocuments();
    const blogPosts = await Post.countDocuments({ category: 'Blog' });
    const newsPosts = await Post.countDocuments({ category: 'News' });

    console.log('\n✨ Hoàn thành seed dữ liệu!');
    console.log(`   📝 Tổng bài viết: ${totalPosts}`);
    console.log(`   📖 Blog: ${blogPosts}`);
    console.log(`   📰 Tin Tức: ${newsPosts}`);
  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

main();

