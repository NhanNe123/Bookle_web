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
              <h3>123 Đường ABC, Quận XYZ, Hà Nội</h3>
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
                  <h3>{t('footer.customerSupport.title')}</h3>
                </div>
                <ul className="list-area">
                  <li>
                    <Link to="/shop">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.customerSupport.storeList')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.customerSupport.openingHours')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.customerSupport.contactUs')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.customerSupport.returnPolicy')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 ps-lg-5 wow fadeInUp" data-wow-delay=".6s">
              <div className="single-footer-widget">
                <div className="widget-head">
                  <h3>{t('footer.categories.title')}</h3>
                </div>
                <ul className="list-area">
                  <li>
                    <Link to="/shop">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.categories.novel')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/shop">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.categories.poetry')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/shop">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.categories.political')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/shop">
                      <i className="fa-solid fa-chevrons-right"></i>
                      {t('footer.categories.history')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay=".8s">
              <div className="single-footer-widget">
                <div className="widget-head">
                  <h3>{t('footer.newsletter.title')}</h3>
                </div>
                <div className="footer-content">
                  <p>{t('footer.newsletter.description')}</p>
                  <form onSubmit={handleNewsletterSubmit} className="footer-input">
                    <input 
                      type="email" 
                      id="email2" 
                      placeholder={t('footer.newsletter.placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button className="newsletter-btn" type="submit">
                      <i className="fa-regular fa-paper-plane"></i>
                    </button>
                  </form>
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
