import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Implement newsletter subscription logic
    console.log('Newsletter subscription for:', email);
    setEmail('');
  };

  return (
    <footer className="footer-section footer-bg">
      <div className="container">
        <div className="contact-info-area">
          <div className="contact-info-items wow fadeInUp" data-wow-delay=".2s">
            <div className="icon">
              <i className="icon-icon-5"></i>
            </div>
            <div className="content">
              <p>{t('footer.contactInfo.callUs')}</p>
              <h3>
                <a href="tel:+2085550112">038-346-1187</a>
              </h3>
            </div>
          </div>
          <div className="contact-info-items wow fadeInUp" data-wow-delay=".4s">
            <div className="icon">
              <i className="icon-icon-6"></i>
            </div>
            <div className="content">
              <p>{t('footer.contactInfo.makeQuote')}</p>
              <h3>
                <a href="mailto:kimhung@gmail.com">kimhung@gmail.com</a>
              </h3>
            </div>
          </div>
          <div className="contact-info-items wow fadeInUp" data-wow-delay=".6s">
            <div className="icon">
              <i className="icon-icon-7"></i>
            </div>
            <div className="content">
              <p>{t('footer.contactInfo.openingHour')}</p>
              <h3>{t('footer.contactInfo.openingHours')}</h3>
            </div>
          </div>
          <div className="contact-info-items wow fadeInUp" data-wow-delay=".8s">
            <div className="icon">
              <i className="icon-icon-8"></i>
            </div>
            <div className="content">
              <p>{t('footer.contactInfo.location')}</p>
              <h3>Khu II, Đ. 3/2, Ninh Kiều, Cần Thơ</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-widgets-wrapper">
        <div className="plane-shape float-bob-y">
          <img src="/assets/img/plane-shape.png" alt="img" />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay=".2s">
              <div className="single-footer-widget">
                <div className="widget-head">
                  <Link to="/">
                    <img src="/assets/img/logo/white-logo.svg" alt="logo-img" />
                  </Link>
                </div>
                <div className="footer-content">
                  <p>
                    {t('footer.about.description')}
                  </p>
                  <div className="social-icon d-flex align-items-center">
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://x.com/" target="_blank" rel="noopener noreferrer">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">
                      <i className="fab fa-youtube"></i>
                    </a>
                    <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 ps-lg-5 wow fadeInUp" data-wow-delay=".4s">
              <div className="single-footer-widget">
                <div className="widget-head">
                  <h3>Danh mục</h3>
                </div>
                <ul className="list-area">
                  <li>
                    <Link to="/about">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Về chúng tôi
                    </Link>
                  </li>
                  <li>
                    <Link to="/shop">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Cửa hàng sách
                    </Link>
                  </li>
                  <li>
                    <Link to="/authors">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Tác giả
                    </Link>
                  </li>
                  <li>
                    <Link to="/news">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Tin tức
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 ps-lg-5 wow fadeInUp" data-wow-delay=".6s">
              <div className="single-footer-widget">
                <div className="widget-head">
                  <h3>Hỗ trợ</h3>
                </div>
                <ul className="list-area">
                  <li>
                    <Link to="/faq">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Câu hỏi thường gặp
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Chính sách đổi trả
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Bảo mật thông tin
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevrons-right"></i>
                      Liên hệ hỗ trợ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay=".8s">
              <div className="single-footer-widget">
                <div className="widget-head">
                  <h3>Liên hệ</h3>
                </div>
                <div className="footer-content">
                  <p style={{ marginBottom: 12 }}>
                    <i className="fa-solid fa-location-dot" style={{ marginRight: 8 }}></i>
                    Khu II, Đ. 3/2, Xuân Khánh,<br/>Ninh Kiều, Cần Thơ
                  </p>
                  <p style={{ marginBottom: 16 }}>
                    <i className="fa-solid fa-envelope" style={{ marginRight: 8 }}></i>
                    bookle.cantho@gmail.com
                  </p>
                  <div className="social-icon d-flex align-items-center">
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" title="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" title="TikTok">
                      <i className="fab fa-tiktok"></i>
                    </a>
                    <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" title="YouTube">
                      <i className="fab fa-youtube"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-wrapper d-flex align-items-center justify-content-between">
            {/* Payment logos temporarily hidden - images not available yet */}
            {/* <ul className="brand-logo wow fadeInRight" data-wow-delay=".5s">
              <li>
                <Link to="/contact">
                  <img src="/assets/img/visa-logo.png" alt="img" />
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <img src="/assets/img/mastercard.png" alt="img" />
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <img src="/assets/img/payoneer.png" alt="img" />
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <img src="/assets/img/affirm.png" alt="img" />
                </Link>
              </li>
            </ul> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
