import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { contactAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Map switched to embedded iframe per request

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await contactAPI.sendMessage(formData);
      if (response.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.error || 'Gửi tin nhắn thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // === BƯỚC 1: CẬP NHẬT MẢNG DỮ LIỆU ===
  const contactInfo = [
    {
      icon: 'fa-solid fa-location-dot',
      title: 'Địa chỉ',
      content: '123 Đường ABC, Quận XYZ, Hà Nội',
      link: null
    },
    {
      icon: 'fa-solid fa-phone',
      title: 'Điện thoại',
      content: '038-346-1187',
      link: 'tel:0383461187'
    },
    {
      icon: 'fa-solid fa-envelope',
      title: 'Email',
      content: 'kimhung@gmail.com',
      link: 'mailto:kimhung@gmail.com'
    },
    {
      icon: 'fa-solid fa-clock',
      title: 'Giờ làm việc',
      content: 'Thứ 2 - Chủ nhật: 8:00 - 22:00',
      link: null
    },
    // === CÁC MỤC MẠNG XÃ HỘI MỚI THÊM VÀO ===
    {
      icon: 'fa-brands fa-facebook-f',
      title: 'Facebook',
      content: 'Theo dõi trên Facebook',
      link: 'https://www.facebook.com/' // <-- Thay link thật
    },
    {
      icon: 'fa-brands fa-tiktok',
      title: 'TikTok',
      content: 'Theo dõi trên TikTok',
      link: 'https://www.tiktok.com/' // <-- Thay link thật
    },
    {
      icon: 'fa-brands fa-youtube',
      title: 'YouTube',
      content: 'Xem kênh YouTube',
      link: 'https://www.youtube.com/' // <-- Thay link thật
    }
  ];

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
            <h1>Liên hệ với chúng tôi</h1>
            <div className="page-header">
              <ul className="breadcrumb-items">
                <li>
                  <Link to="/">Trang chủ</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>Liên hệ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section className="contact-section section-padding">
        <div className="container">
          {/* Success Message */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <strong>Thành công!</strong> Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.
              <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          <div className="row g-4">
            {/* Contact Info Cards */}
            <div className="col-lg-4">
              <div className="contact-info-wrapper">
                <h2 className="mb-4">
                  Thông tin liên hệ
                </h2>
                <p className="mb-4" style={{ color: '#666', lineHeight: '1.8' }}>
                  Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi qua bất kỳ phương thức nào dưới đây.
                </p>
                
                {contactInfo.map((info, index) => (
                  <div key={index} className="contact-info-item mb-4">
                    <div className="d-flex align-items-start">
                      <div className="contact-icon me-3" style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '50%', 
                        background: '#3040D6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {/* === BƯỚC 2: SỬA LẠI THẺ ICON === */}
                        <i className={info.icon} style={{ color: '#fff', fontSize: '20px' }}></i>
                      </div>
                      <div className="contact-content">
                        <h5 style={{ marginBottom: '5px', fontSize: '18px', fontWeight: 'bold' }}>
                          {info.title}
                        </h5>
                        {info.link ? (
                          <a 
                            href={info.link} 
                            target={info.link.startsWith('http') ? '_blank' : undefined}
                            rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            style={{ color: '#666', textDecoration: 'none' }}
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p style={{ color: '#666', margin: 0 }}>{info.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* === BƯỚC 3: KHỐI SOCIAL-MEDIA CŨ ĐÃ BỊ XÓA === */}

              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-8">
              <div className="contact-form-wrapper">
                <h2 className="mb-4">
                  Gửi tin nhắn cho chúng tôi
                </h2>
                <p className="mb-4" style={{ color: '#666' }}>
                  Điền form bên dưới và chúng tôi sẽ phản hồi trong vòng 24 giờ.
                </p>

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">
                          Họ và tên <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">
                          Email <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="Nhập email"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Nhập số điện thoại (tùy chọn)"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="subject" className="form-label">
                          Chủ đề <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          placeholder="Nhập chủ đề"
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group">
                        <label htmlFor="message" className="form-label">
                          Tin nhắn <span style={{ color: 'red' }}>*</span>
                        </label>
                        <textarea
                          className="form-control"
                          id="message"
                          name="message"
                          rows="6"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          placeholder="Nhập tin nhắn của bạn..."
                        ></textarea>
                      </div>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="theme-btn"
                        disabled={loading}
                        style={{ minWidth: '150px' }}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="small" variant="dots" className="me-2" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            Gửi tin nhắn <i className="fa-solid fa-paper-plane ms-2"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Section (Embed) */}
      <section className="map-section">
        <div className="container">
          <div className="map-card">
            <div className="map-wrapper">
              <iframe 
                title="Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125412.92766173022!2d105.70873417758946!3d10.034185839371624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0629f6de3edb7%3A0x527f09dbfb20b659!2zQ-G6p24gVGjGoSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1635566424415!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .contact-section {
          background: #fff;
        }
        .contact-form-wrapper {
          background: #f8f9fa;
          padding: 40px;
          border-radius: 10px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          display: block;
        }
        .form-control {
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          transition: all 0.3s;
        }
        .form-control:focus {
          border-color: #3040D6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(48, 64, 214, 0.1);
        }
        .contact-info-item {
          padding: 20px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        .contact-info-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .theme-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .map-section {
          margin-top: 60px;
        }
        .map-card {
          position: relative;
          border-radius: 18px;
          padding: 8px;
          background: linear-gradient(135deg, rgba(48, 64, 214, 0.15), rgba(86, 204, 242, 0.2));
          box-shadow: 0 20px 35px rgba(48, 64, 214, 0.15);
        }
        .map-wrapper {
          height: 320px;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
        }
        @media (max-width: 992px) {
          .map-wrapper {
            height: 280px;
          }
        }
        @media (max-width: 768px) {
          .contact-form-wrapper {
            padding: 25px;
          }
          .map-card {
            padding: 6px;
          }
          .map-wrapper {
            height: 240px;
          }
        }
      `}</style>
    </>
  );
};

export default ContactPage;