import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import ProductList from '../components/product/ProductList';
import { getProducts } from '../lib/api';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Check for OAuth errors, verification, or success in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const loginParam = searchParams.get('login');
    const verifiedParam = searchParams.get('verified');
    
    if (errorParam === 'google_not_configured') {
      setNotification({ type: 'warning', message: 'Google OAuth chưa được cấu hình. Vui lòng sử dụng email/password để đăng nhập.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (errorParam === 'facebook_not_configured') {
      setNotification({ type: 'warning', message: 'Facebook OAuth chưa được cấu hình. Vui lòng sử dụng email/password để đăng nhập.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (errorParam === 'invalid_or_expired_token') {
      setNotification({ type: 'danger', message: 'Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (errorParam === 'verification_failed') {
      setNotification({ type: 'danger', message: 'Xác thực email thất bại. Vui lòng thử lại.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (verifiedParam === 'success') {
      setNotification({ type: 'success', message: '✅ Email đã được xác thực thành công! Chào mừng bạn đến với Bookle.' });
      searchParams.delete('verified');
      setSearchParams(searchParams);
    } else if (loginParam === 'success') {
      setNotification({ type: 'success', message: 'Đăng nhập thành công! Chào mừng bạn đến với Bookle.' });
      searchParams.delete('login');
      setSearchParams(searchParams);
    } else if (loginParam === 'failed') {
      setNotification({ type: 'danger', message: 'Đăng nhập thất bại. Vui lòng thử lại.' });
      searchParams.delete('login');
      setSearchParams(searchParams);
    }
    
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch latest products
        const data = await getProducts({ limit: 8 });
        setNewProducts(data.items || []);
        // For now, use same products as featured
        setFeaturedProducts(data.items?.slice(0, 4) || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="home-page">
      {/* Notification */}
      {notification && (
        <div 
          className={`alert alert-${notification.type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`}
          style={{ zIndex: 9999, maxWidth: '500px' }}
          role="alert"
        >
          {notification.message}
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Feature Section */}
      <section className="feature-section fix section-padding">
        <div className="container">
          <div className="feature-wrapper">
            <div className="row g-4">
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".3s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-truck-fast"></i>
                  </div>
                  <div className="content">
                    <h4>Miễn phí vận chuyển</h4>
                    <p>Đơn hàng từ 200.000đ</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".5s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-credit-card"></i>
                  </div>
                  <div className="content">
                    <h4>Thanh toán an toàn</h4>
                    <p>100% bảo mật</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".7s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-shield-check"></i>
                  </div>
                  <div className="content">
                    <h4>Chính hãng 100%</h4>
                    <p>Cam kết chất lượng</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".9s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-headset"></i>
                  </div>
                  <div className="content">
                    <h4>Hỗ trợ 24/7</h4>
                    <p>Luôn sẵn sàng phục vụ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Shop Section - New Products */}
      <section className="shop-section section-padding fix pt-0">
        <div className="container">
          <div className="section-title text-center">
            <h2 className="mb-3 wow fadeInUp" data-wow-delay=".3s">
              Sách Mới Nhất
            </h2>
          </div>
          <ProductList 
            products={newProducts} 
            loading={loading} 
            error={error}
            columns={4}
          />
          {!loading && newProducts.length > 0 && (
            <div className="text-center mt-5 wow fadeInUp" data-wow-delay=".4s">
              <Link to="/shop" className="theme-btn">
                Xem tất cả <i className="fa-solid fa-arrow-right-long"></i>
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="book-category-section section-padding fix pt-0">
        <div className="container">
          <div className="section-title text-center">
            <h2 className="mb-3 wow fadeInUp" data-wow-delay=".3s">
              Danh Mục Sách
            </h2>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { name: 'Văn học', icon: 'fa-book', slug: 'tieu-thuyet' },
              { name: 'Thiếu nhi', icon: 'fa-child', slug: 'thieu-nhi' },
              { name: 'Khoa học', icon: 'fa-flask', slug: 'khoa-hoc' },
              { name: 'Kinh doanh', icon: 'fa-briefcase', slug: 'kinh-doanh' },
              { name: 'Công nghệ', icon: 'fa-laptop-code', slug: 'cong-nghe' },
              { name: 'Nghệ thuật', icon: 'fa-palette', slug: 'nghe-thuat' },
            ].map((category, index) => (
              <div key={category.slug} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 wow fadeInUp" data-wow-delay={`.${index + 3}s`}>
                <Link to={`/shop?category=${category.slug}`} className="category-card text-center">
                  <div className="category-icon">
                    <i className={`fa-solid ${category.icon}`}></i>
                  </div>
                  <h5 className="mt-3">{category.name}</h5>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner-section section-padding pt-0">
        <div className="container">
          <div className="cta-banner-wrapper bg-cover" style={{backgroundImage: 'url(/assets/img/cta-banner.jpg)'}}>
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="cta-content">
                  <h2 className="wow fadeInUp" data-wow-delay=".3s">
                    Giảm giá <span className="text-warning">30%</span> 
                    <br />Tất cả sách trong tháng này
                  </h2>
                  <Link to="/shop" className="theme-btn mt-4 wow fadeInUp" data-wow-delay=".5s">
                    Mua ngay <i className="fa-solid fa-arrow-right-long"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;