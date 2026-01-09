import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');

  const faqCategories = [
    { id: 'general', label: 'Câu hỏi chung' },
    { id: 'ordering', label: 'Đặt hàng & Thanh toán' },
    { id: 'shipping', label: 'Vận chuyển & Giao hàng' },
    { id: 'returns', label: 'Đổi trả & Hoàn tiền' },
    { id: 'account', label: 'Tài khoản & Bảo mật' },
  ];

  const faqData = {
    general: [
      {
        id: 'gen-1',
        question: 'Bookle là gì?',
        answer: 'Bookle là cửa hàng sách trực tuyến chuyên cung cấp các loại sách với đa dạng thể loại từ văn học, khoa học, lịch sử đến sách thiếu nhi. Chúng tôi cam kết mang đến cho bạn những cuốn sách chất lượng với giá cả hợp lý.'
      },
      {
        id: 'gen-2',
        question: 'Làm thế nào để tìm kiếm sách?',
        answer: 'Bạn có thể tìm kiếm sách bằng cách: (1) Sử dụng thanh tìm kiếm ở header, nhập tên sách, tác giả hoặc từ khóa; (2) Duyệt theo danh mục sách; (3) Sử dụng bộ lọc trên trang Shop để tìm theo giá, thể loại, tác giả.'
      },
      {
        id: 'gen-3',
        question: 'Sách có được đảm bảo chất lượng không?',
        answer: 'Tất cả sách tại Bookle đều là sách chính hãng, được nhập khẩu hoặc mua từ các nhà xuất bản uy tín. Chúng tôi cam kết 100% sách chính hãng, nếu phát hiện sách giả sẽ hoàn tiền gấp đôi.'
      },
      {
        id: 'gen-4',
        question: 'Có hỗ trợ đọc thử sách không?',
        answer: 'Có, bạn có thể đọc thử một phần nội dung sách bằng cách nhấn nút "Read A little" trên trang chi tiết sản phẩm. Tính năng này giúp bạn đánh giá nội dung trước khi quyết định mua.'
      }
    ],
    ordering: [
      {
        id: 'ord-1',
        question: 'Các phương thức thanh toán nào được chấp nhận?',
        answer: 'Chúng tôi chấp nhận các phương thức thanh toán sau: (1) Thanh toán khi nhận hàng (COD); (2) Chuyển khoản ngân hàng; (3) Thẻ tín dụng/ghi nợ (Visa, Mastercard); (4) Ví điện tử (MoMo, ZaloPay, VNPay).'
      },
      {
        id: 'ord-2',
        question: 'Làm thế nào để đặt hàng?',
        answer: 'Để đặt hàng, bạn cần: (1) Thêm sách vào giỏ hàng; (2) Kiểm tra lại giỏ hàng và số lượng; (3) Nhấn "Thanh toán"; (4) Điền thông tin giao hàng; (5) Chọn phương thức thanh toán và xác nhận đơn hàng.'
      },
      {
        id: 'ord-3',
        question: 'Tôi có thể hủy đơn hàng không?',
        answer: 'Bạn có thể hủy đơn hàng trong vòng 2 giờ sau khi đặt. Sau thời gian này, nếu đơn hàng đã được xử lý, bạn cần liên hệ hotline để được hỗ trợ hủy đơn.'
      },
      {
        id: 'ord-4',
        question: 'Làm sao để theo dõi đơn hàng?',
        answer: 'Sau khi đặt hàng thành công, bạn sẽ nhận được email xác nhận kèm mã đơn hàng. Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi" sau khi đăng nhập, hoặc sử dụng mã đơn hàng để tra cứu.'
      }
    ],
    shipping: [
      {
        id: 'ship-1',
        question: 'Phí vận chuyển là bao nhiêu?',
        answer: 'Chúng tôi miễn phí vận chuyển cho đơn hàng từ 200.000đ trở lên. Với đơn hàng dưới 200.000đ, phí vận chuyển là 30.000đ cho nội thành và 50.000đ cho các tỉnh thành khác.'
      },
      {
        id: 'ship-2',
        question: 'Thời gian giao hàng là bao lâu?',
        answer: 'Thời gian giao hàng: (1) Nội thành Hà Nội, TP.HCM: 1-2 ngày làm việc; (2) Các tỉnh thành khác: 3-5 ngày làm việc; (3) Vùng sâu, vùng xa: 5-7 ngày làm việc. Thời gian có thể thay đổi trong các dịp lễ, Tết.'
      },
      {
        id: 'ship-3',
        question: 'Có giao hàng quốc tế không?',
        answer: 'Hiện tại chúng tôi chỉ giao hàng trong phạm vi lãnh thổ Việt Nam. Chúng tôi đang nghiên cứu mở rộng dịch vụ giao hàng quốc tế trong tương lai.'
      },
      {
        id: 'ship-4',
        question: 'Làm sao để thay đổi địa chỉ giao hàng?',
        answer: 'Nếu đơn hàng chưa được xử lý (trong vòng 2 giờ), bạn có thể tự thay đổi địa chỉ trong mục "Đơn hàng của tôi". Nếu đơn hàng đã được xử lý, vui lòng liên hệ hotline để được hỗ trợ.'
      }
    ],
    returns: [
      {
        id: 'ret-1',
        question: 'Chính sách đổi trả như thế nào?',
        answer: 'Bạn có thể đổi trả sách trong vòng 30 ngày kể từ ngày nhận hàng với điều kiện: sách còn nguyên vẹn, chưa sử dụng, còn tem nhãn và hóa đơn. Sách bị lỗi in, thiếu trang sẽ được đổi mới ngay lập tức.'
      },
      {
        id: 'ret-2',
        question: 'Làm thế nào để yêu cầu đổi trả?',
        answer: 'Để yêu cầu đổi trả, bạn cần: (1) Đăng nhập tài khoản và vào mục "Đơn hàng của tôi"; (2) Chọn đơn hàng cần đổi trả và nhấn "Yêu cầu đổi trả"; (3) Điền lý do và gửi yêu cầu. Bộ phận CSKH sẽ liên hệ trong 24h.'
      },
      {
        id: 'ret-3',
        question: 'Phí đổi trả có mất phí không?',
        answer: 'Nếu sách bị lỗi từ phía chúng tôi (lỗi in, thiếu trang, giao sai sách), chúng tôi sẽ chịu toàn bộ phí đổi trả. Nếu đổi trả do lý do khác, khách hàng chịu phí vận chuyển đổi trả.'
      },
      {
        id: 'ret-4',
        question: 'Thời gian hoàn tiền là bao lâu?',
        answer: 'Sau khi nhận được sách đổi trả và kiểm tra, chúng tôi sẽ hoàn tiền trong vòng 3-5 ngày làm việc. Tiền sẽ được hoàn về tài khoản/ngân hàng bạn đã thanh toán ban đầu.'
      }
    ],
    account: [
      {
        id: 'acc-1',
        question: 'Làm thế nào để tạo tài khoản?',
        answer: 'Bạn có thể tạo tài khoản bằng cách: (1) Nhấn nút "Đăng nhập" ở header; (2) Chọn "Tạo tài khoản"; (3) Điền thông tin email, mật khẩu và xác nhận; (4) Hoặc đăng nhập bằng Google/Facebook để tạo tài khoản nhanh.'
      },
      {
        id: 'acc-2',
        question: 'Tôi quên mật khẩu, làm sao để lấy lại?',
        answer: 'Bạn có thể lấy lại mật khẩu bằng cách: (1) Nhấn "Quên mật khẩu" ở trang đăng nhập; (2) Nhập email đã đăng ký; (3) Kiểm tra email và làm theo hướng dẫn để đặt lại mật khẩu mới.'
      },
      {
        id: 'acc-3',
        question: 'Thông tin cá nhân có được bảo mật không?',
        answer: 'Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Tất cả dữ liệu được mã hóa và chỉ sử dụng cho mục đích phục vụ đơn hàng. Chúng tôi không chia sẻ thông tin cho bên thứ ba.'
      },
      {
        id: 'acc-4',
        question: 'Có thể xóa tài khoản không?',
        answer: 'Có, bạn có thể yêu cầu xóa tài khoản bằng cách liên hệ bộ phận CSKH hoặc gửi email đến support@bookle.com. Lưu ý: Việc xóa tài khoản sẽ xóa toàn bộ lịch sử đơn hàng và không thể khôi phục.'
      }
    ]
  };

  const currentFAQs = faqData[activeCategory] || [];

  return (
    <>
      {/* Breadcrumb Section */}
      <div className="breadcrumb-wrapper">
        <div className="book1">
          <img src="/assets/img/hero/book1.png" alt="book" />
        </div>
        <div className="book2">
          <img src="/assets/img/hero/book2.png" alt="book" />
        </div>
        <div className="container">
          <div className="page-heading">
            <h1>Câu hỏi thường gặp</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>FAQ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="faq-section fix section-padding">
        <div className="container">
          <div className="row">
            {/* FAQ Categories Sidebar */}
            <div className="col-lg-3">
              <div className="faq-left">
                <nav>
                  <ul className="nav flex-column">
                    {faqCategories.map((category) => (
                      <li key={category.id} className="nav-item">
                        <button
                          className={`nav-link ${activeCategory === category.id ? 'active' : ''}`}
                          onClick={() => setActiveCategory(category.id)}
                          type="button"
                        >
                          {category.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="col-lg-9">
              <div className="faq-content">
                <div className="section-title mb-4">
                  <h2>{faqCategories.find(c => c.id === activeCategory)?.label}</h2>
                  <p>Dưới đây là các câu hỏi thường gặp về {faqCategories.find(c => c.id === activeCategory)?.label.toLowerCase()}</p>
                </div>

                <div className="accordion" id="faqAccordion">
                  {currentFAQs.map((faq, index) => (
                    <div key={faq.id} className="accordion-item">
                      <h2 className="accordion-header" id={`heading-${faq.id}`}>
                        <button
                          className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse-${faq.id}`}
                          aria-expanded={index === 0 ? 'true' : 'false'}
                          aria-controls={`collapse-${faq.id}`}
                        >
                          {faq.question}
                        </button>
                      </h2>
                      <div
                        id={`collapse-${faq.id}`}
                        className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                        aria-labelledby={`heading-${faq.id}`}
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contact Support Section */}
                <div className="faq-support mt-5 p-4" style={{ 
                  background: 'linear-gradient(135deg, rgba(48, 64, 214, 0.08), rgba(255, 255, 255, 0.9))',
                  borderRadius: '12px',
                  border: '1px solid rgba(48, 64, 214, 0.15)'
                }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="support-icon" style={{ 
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3040D6, #00b4ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <i className="fa-solid fa-headset text-white" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-2" style={{ color: '#1a1a1a', fontWeight: '600' }}>
                        Không tìm thấy câu trả lời?
                      </h5>
                      <p className="mb-2" style={{ color: '#6f7480', margin: 0 }}>
                        Nếu bạn vẫn còn thắc mắc, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ khách hàng của chúng tôi luôn sẵn sàng giúp đỡ bạn.
                      </p>
                      <Link to="/contact" className="theme-btn" style={{ marginTop: '10px', display: 'inline-block' }}>
                        Liên hệ hỗ trợ <i className="fa-solid fa-arrow-right ms-2"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQPage;
